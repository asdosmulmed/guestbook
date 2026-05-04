import React, { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Upload, X, FileSpreadsheet, AlertCircle, CheckCircle2, Download, Loader2 } from 'lucide-react';
import api from '../services/api';

const REQUIRED_COLUMNS = ['nama'];
const OPTIONAL_COLUMNS = ['kategori', 'alamat'];

function normalizeHeader(header) {
  return String(header).toLowerCase().trim();
}

export default function ImportGuestModal({ eventId, onClose, onSuccess }) {
  const [step, setStep] = useState('upload'); // 'upload' | 'preview' | 'result'
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [parseError, setParseError] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  // ── Parse Excel/CSV ───────────────────────────────────────────
  const parseFile = (file) => {
    setParseError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (json.length === 0) {
          setParseError('File kosong atau tidak ada data.');
          return;
        }

        // Normalize headers
        const firstRow = json[0];
        const headers = Object.keys(firstRow).map(normalizeHeader);

        if (!headers.includes('nama')) {
          setParseError('Kolom "nama" wajib ada. Pastikan header sesuai template.');
          return;
        }

        // Map rows to normalized structure
        const mapped = json.map((row) => {
          const normalized = {};
          Object.keys(row).forEach((key) => {
            normalized[normalizeHeader(key)] = row[key];
          });
          return {
            name: String(normalized['nama'] ?? '').trim(),
            category: String(normalized['kategori'] ?? 'Reguler').trim() || 'Reguler',
            address: String(normalized['alamat'] ?? '').trim() || '',
          };
        }).filter((r) => r.name !== '');

        if (mapped.length === 0) {
          setParseError('Tidak ada baris data yang valid (kolom "nama" kosong semua).');
          return;
        }

        setRows(mapped);
        setStep('preview');
      } catch (err) {
        setParseError('Gagal membaca file. Pastikan format file Excel (.xlsx) atau CSV.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (selectedFile) => {
    if (!selectedFile) return;
    const ext = selectedFile.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      setParseError('Format tidak didukung. Gunakan .xlsx, .xls, atau .csv');
      return;
    }
    setFile(selectedFile);
    parseFile(selectedFile);
  };

  // ── Drag & Drop ───────────────────────────────────────────────
  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileChange(dropped);
  }, []);

  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);

  // ── Download Template ─────────────────────────────────────────
  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ['nama', 'kategori', 'alamat'],
      ['Budi Santoso', 'VIP', 'Jl. Merdeka No. 1, Jakarta'],
      ['Siti Rahayu', 'Reguler', 'Jl. Sudirman No. 5, Bandung'],
      ['Andi Wijaya', 'VIP', ''],
    ]);
    ws['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Tamu Undangan');
    XLSX.writeFile(wb, 'template_tamu_undangan.xlsx');
  };

  // ── Import to Backend ─────────────────────────────────────────
  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await api.post('/guests/import', {
        guests: rows,
      });
      setImportResult(res.data);
      setStep('result');
      onSuccess?.();
    } catch (err) {
      setParseError(err.response?.data?.message || 'Import gagal. Coba lagi.');
    } finally {
      setImporting(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setRows([]);
    setParseError('');
    setStep('upload');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Import Tamu dari Excel</h2>
              <p className="text-sm text-slate-500">Upload file Excel/CSV berisi daftar tamu undangan</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ─── STEP: Upload ─────────────────────── */}
          {step === 'upload' && (
            <div className="space-y-5">
              {/* Template download */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div>
                  <p className="text-sm font-semibold text-blue-800">Belum punya template?</p>
                  <p className="text-xs text-blue-600 mt-0.5">Download template Excel dengan kolom yang sudah benar</p>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <Download size={15} />
                  Download Template
                </button>
              </div>

              {/* Drop zone */}
              <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center gap-4 p-12 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50'
                  }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files[0])}
                />
                <div className={`p-4 rounded-full transition-colors ${isDragging ? 'bg-blue-100' : 'bg-slate-200'}`}>
                  <Upload size={32} className={isDragging ? 'text-blue-600' : 'text-slate-500'} />
                </div>
                <div className="text-center">
                  <p className="text-slate-700 font-semibold text-base">
                    {isDragging ? 'Lepaskan file di sini' : 'Drag & drop atau klik untuk upload'}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">Mendukung .xlsx, .xls, .csv</p>
                </div>
              </div>

              {/* Format info */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-sm">
                <p className="font-semibold text-slate-700 mb-2">Format kolom yang dikenali:</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 bg-red-50 text-red-600 border border-red-200 rounded-full text-xs font-medium">nama *</span>
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-xs font-medium">kategori</span>
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-xs font-medium">alamat</span>
                </div>
                <p className="text-slate-400 text-xs mt-2">* Kolom wajib. Kolom lain bersifat opsional.</p>
              </div>

              {/* Error */}
              {parseError && (
                <div className="flex items-start gap-3 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <p>{parseError}</p>
                </div>
              )}
            </div>
          )}

          {/* ─── STEP: Preview ────────────────────── */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">
                    Preview Data — <span className="text-blue-600">{rows.length} tamu</span> siap diimport
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">File: {file?.name}</p>
                </div>
                <button onClick={resetUpload} className="text-sm text-slate-500 hover:text-slate-800 underline">
                  Ganti File
                </button>
              </div>

              {parseError && (
                <div className="flex items-start gap-3 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <p>{parseError}</p>
                </div>
              )}

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
                <table className="w-full text-sm text-left">
                  <thead className="sticky top-0 bg-slate-100 z-10">
                    <tr>
                      <th className="p-3 text-slate-600 font-semibold">#</th>
                      <th className="p-3 text-slate-600 font-semibold">Nama</th>
                      <th className="p-3 text-slate-600 font-semibold">Kategori</th>
                      <th className="p-3 text-slate-600 font-semibold">Alamat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr key={idx} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-slate-400 text-xs">{idx + 1}</td>
                        <td className="p-3 font-medium text-slate-900">{row.name}</td>
                        <td className="p-3">
                          <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-medium ${row.category === 'VIP'
                              ? 'bg-blue-50 text-blue-600 border border-blue-200'
                              : row.category === 'Keluarga'
                                ? 'bg-purple-50 text-purple-600 border border-purple-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                            {row.category || 'Reguler'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500 text-xs">{row.address || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── STEP: Result ─────────────────────── */}
          {step === 'result' && importResult && (
            <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
              <div className="p-4 bg-green-100 rounded-full text-green-600">
                <CheckCircle2 size={40} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Import Berhasil!</h3>
                <p className="text-slate-500 mt-1">{importResult.message}</p>
              </div>
              <div className="flex gap-6 mt-2">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{importResult.inserted}</p>
                  <p className="text-sm text-slate-500">Tamu ditambahkan</p>
                </div>
                {importResult.skipped > 0 && (
                  <div className="text-center">
                    <p className="text-3xl font-bold text-slate-400">{importResult.skipped}</p>
                    <p className="text-sm text-slate-500">Baris dilewati</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-100 gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            {step === 'result' ? 'Tutup' : 'Batal'}
          </button>

          {step === 'preview' && (
            <button
              onClick={handleImport}
              disabled={importing || rows.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {importing ? (
                <><Loader2 size={16} className="animate-spin" /> Mengimport...</>
              ) : (
                <><Upload size={16} /> Import {rows.length} Tamu</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
