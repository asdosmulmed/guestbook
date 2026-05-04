<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Guest;
use App\Models\Attendance;
use Illuminate\Support\Facades\DB;

class GuestbookController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // If admin and no event_id, maybe return all, but based on requirements:
        // "Fetch all guests *only* for the authenticated user's event_id."
        if (!$user->event_id) {
            return response()->json(['message' => 'No event assigned to user'], 403);
        }

        $guests = Guest::with('attendance')
            ->where('event_id', $user->event_id)
            ->get();

        $event = \App\Models\Event::find($user->event_id);

        return response()->json([
            'data' => $guests,
            'event' => $event
        ]);
    }

    public function checkIn(Request $request)
    {
        $request->validate([
            'guest_id' => 'required|exists:guests,id',
            'pax' => 'required|integer|min:1',
        ]);

        $user = $request->user();

        if (!$user->event_id) {
            return response()->json(['message' => 'No event assigned to user'], 403);
        }

        $guest = Guest::where('id', $request->guest_id)
                      ->where('event_id', $user->event_id)
                      ->first();

        if (!$guest) {
            return response()->json(['message' => 'Guest not found for your event'], 404);
        }

        if ($guest->attendance) {
            return response()->json(['message' => 'Guest has already checked in'], 422);
        }

        $attendance = Attendance::create([
            'guest_id' => $guest->id,
            'user_id' => $user->id,
            'pax' => $request->pax,
            'check_in_time' => now(),
        ]);

        // Refresh guest to include new attendance relation so is_attended reflects correctly
        $guest->load('attendance');

        return response()->json([
            'message' => 'Guest checked in successfully',
            'data' => $guest
        ], 201);
    }

    public function manualCheckIn(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'pax' => 'required|integer|min:1',
            'address' => 'nullable|string|max:500',
        ]);

        $user = $request->user();

        if (!$user->event_id) {
            return response()->json(['message' => 'No event assigned to user'], 403);
        }

        DB::beginTransaction();

        try {
            $guest = Guest::create([
                'event_id' => $user->event_id,
                'name' => $request->name,
                'category' => 'Walk-in',
                'address' => $request->address,
                'is_unregistered' => true,
            ]);

            $attendance = Attendance::create([
                'guest_id' => $guest->id,
                'user_id' => $user->id,
                'pax' => $request->pax,
                'check_in_time' => now(),
            ]);

            DB::commit();

            $guest->load('attendance');

            return response()->json([
                'message' => 'Manual check-in successful',
                'data' => $guest
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'An error occurred during manual check-in'], 500);
        }
    }

    public function undoCheckIn(Request $request, $guestId)
    {
        $user = $request->user();

        if (!$user->event_id) {
            return response()->json(['message' => 'No event assigned to user'], 403);
        }

        $attendance = Attendance::where('guest_id', $guestId)
            ->whereHas('guest', function ($q) use ($user) {
                $q->where('event_id', $user->event_id);
            })->first();

        if (!$attendance) {
            return response()->json(['message' => 'Attendance record not found'], 404);
        }

        $attendance->delete();

        // If it was an unregistered walk-in guest, we might want to delete the guest record as well?
        // Usually yes, if it's a mistake. Let's delete the guest if they are unregistered to avoid orphan records.
        $guest = Guest::find($guestId);
        if ($guest && $guest->is_unregistered) {
            $guest->delete();
            return response()->json(['message' => 'Walk-in guest record and attendance removed', 'deleted_guest' => true]);
        }

        $guest->load('attendance');

        return response()->json([
            'message' => 'Attendance removed successfully',
            'data' => $guest
        ]);
    }

    public function updateCheckIn(Request $request, $guestId)
    {
        $request->validate([
            'pax' => 'required|integer|min:1',
        ]);

        $user = $request->user();

        if (!$user->event_id) {
            return response()->json(['message' => 'No event assigned to user'], 403);
        }

        $attendance = Attendance::where('guest_id', $guestId)
            ->whereHas('guest', function ($q) use ($user) {
                $q->where('event_id', $user->event_id);
            })->first();

        if (!$attendance) {
            return response()->json(['message' => 'Attendance record not found'], 404);
        }

        $attendance->update([
            'pax' => $request->pax
        ]);

        $guest = Guest::find($guestId)->load('attendance');

        return response()->json([
            'message' => 'Attendance updated successfully',
            'data' => $guest
        ]);
    }

    public function importGuests(Request $request)
    {
        $request->validate([
            'guests'         => 'required|array|min:1',
            'guests.*.name'  => 'required|string|max:255',
            'guests.*.category' => 'nullable|string|max:100',
            'guests.*.address'  => 'nullable|string|max:500',
        ]);

        $user = $request->user();

        if (!$user->event_id) {
            return response()->json(['message' => 'No event assigned to user'], 403);
        }

        $rows     = $request->guests;
        $inserted = 0;
        $skipped  = 0;

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            foreach ($rows as $row) {
                $name = trim($row['name'] ?? '');
                if (empty($name)) {
                    $skipped++;
                    continue;
                }

                Guest::create([
                    'event_id'        => $user->event_id,
                    'name'            => $name,
                    'category'        => trim($row['category'] ?? 'Reguler') ?: 'Reguler',
                    'address'         => trim($row['address'] ?? '') ?: null,
                    'is_unregistered' => false,
                ]);

                $inserted++;
            }

            \Illuminate\Support\Facades\DB::commit();
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['message' => 'Import gagal: ' . $e->getMessage()], 500);
        }

        return response()->json([
            'message'  => "Import selesai. $inserted tamu berhasil ditambahkan, $skipped baris dilewati.",
            'inserted' => $inserted,
            'skipped'  => $skipped,
        ], 201);
    }
}
