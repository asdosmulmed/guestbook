<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use App\Models\Event;
use App\Models\User;
use App\Models\Guest;

class AdminController extends Controller
{
    private function checkAdmin(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            abort(response()->json(['message' => 'Unauthorized'], 403));
        }
    }

    // ==========================================
    // EVENTS CRUD
    // ==========================================

    public function getEvents(Request $request)
    {
        $this->checkAdmin($request);
        $events = Event::orderBy('event_date', 'desc')->get();
        return response()->json(['data' => $events]);
    }

    public function getStats(Request $request)
    {
        $this->checkAdmin($request);

        $totalEvents       = Event::count();
        $totalActive       = Event::where('is_active', true)->count();
        $totalGuests       = \App\Models\Guest::count();
        $totalAttended     = \App\Models\Attendance::count();
        $totalReceptionists = User::where('role', 'receptionist')->count();

        $events = Event::withCount([
            'guests',
            'guests as attended_count' => function ($q) {
                $q->whereHas('attendance');
            },
        ])->orderBy('event_date', 'desc')->get()->map(function ($e) {
            $e->attendance_rate = $e->guests_count > 0
                ? round(($e->attended_count / $e->guests_count) * 100)
                : 0;
            return $e;
        });

        return response()->json([
            'summary' => [
                'total_events'       => $totalEvents,
                'total_active'       => $totalActive,
                'total_guests'       => $totalGuests,
                'total_attended'     => $totalAttended,
                'total_receptionists' => $totalReceptionists,
            ],
            'events' => $events,
        ]);
    }

    public function createEvent(Request $request)
    {
        $this->checkAdmin($request);
        $request->validate([
            'title' => 'required|string|max:255',
            'event_date' => 'required|date',
            'is_active' => 'boolean',
        ]);

        $event = Event::create([
            'title' => $request->title,
            'event_date' => $request->event_date,
            'is_active' => $request->is_active ?? true,
        ]);

        return response()->json(['message' => 'Event created successfully', 'data' => $event], 201);
    }

    public function updateEvent(Request $request, $id)
    {
        $this->checkAdmin($request);
        $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'event_date' => 'sometimes|required|date',
            'is_active' => 'boolean',
        ]);

        $event = Event::findOrFail($id);
        $event->update($request->only(['title', 'event_date', 'is_active']));

        return response()->json(['message' => 'Event updated successfully', 'data' => $event]);
    }

    public function deleteEvent(Request $request, $id)
    {
        $this->checkAdmin($request);
        $event = Event::findOrFail($id);
        $event->delete();

        return response()->json(['message' => 'Event deleted successfully']);
    }

    public function setEvent(Request $request)
    {
        $this->checkAdmin($request);
        $request->validate(['event_id' => 'required|exists:events,id']);

        $user = $request->user();
        $user->event_id = $request->event_id;
        $user->save();

        return response()->json(['message' => 'Active event updated successfully', 'user' => $user]);
    }

    // ==========================================
    // USERS (OFFICERS) CRUD
    // ==========================================

    public function getUsers(Request $request)
    {
        $this->checkAdmin($request);
        // We only want to manage receptionists, not other admins
        $users = User::with('event')->where('role', 'receptionist')->get();
        return response()->json(['data' => $users]);
    }

    public function createUser(Request $request)
    {
        $this->checkAdmin($request);
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'event_id' => 'required|exists:events,id',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'receptionist',
            'event_id' => $request->event_id,
        ]);

        return response()->json(['message' => 'User created successfully', 'data' => $user->load('event')], 201);
    }

    public function updateUser(Request $request, $id)
    {
        $this->checkAdmin($request);
        $user = User::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:6',
            'event_id' => 'sometimes|required|exists:events,id',
        ]);

        $data = $request->only(['name', 'email', 'event_id']);
        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        return response()->json(['message' => 'User updated successfully', 'data' => $user->load('event')]);
    }

    public function deleteUser(Request $request, $id)
    {
        $this->checkAdmin($request);
        $user = User::findOrFail($id);
        
        if ($user->role === 'admin') {
            return response()->json(['message' => 'Cannot delete another admin'], 403);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }

    // ==========================================
    // GUEST IMPORT
    // ==========================================

    public function importGuests(Request $request)
    {
        $this->checkAdmin($request);

        $request->validate([
            'event_id' => 'required|exists:events,id',
            'guests'   => 'required|array|min:1',
            'guests.*.name' => 'required|string|max:255',
            'guests.*.category' => 'nullable|string|max:100',
            'guests.*.address' => 'nullable|string|max:500',
        ]);

        $eventId = $request->event_id;
        $rows    = $request->guests;

        $inserted = 0;
        $skipped  = 0;
        $errors   = [];

        DB::beginTransaction();
        try {
            foreach ($rows as $index => $row) {
                $name = trim($row['name'] ?? '');
                if (empty($name)) {
                    $skipped++;
                    continue;
                }

                Guest::create([
                    'event_id'      => $eventId,
                    'name'          => $name,
                    'category'      => trim($row['category'] ?? 'Reguler') ?: 'Reguler',
                    'address'       => trim($row['address'] ?? '') ?: null,
                    'is_unregistered' => false,
                ]);

                $inserted++;
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Import gagal: ' . $e->getMessage()], 500);
        }

        return response()->json([
            'message'  => "Import selesai. $inserted tamu berhasil ditambahkan, $skipped baris dilewati.",
            'inserted' => $inserted,
            'skipped'  => $skipped,
        ], 201);
    }
}
