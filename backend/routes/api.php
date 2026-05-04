<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\GuestbookController;
use App\Http\Controllers\Api\AdminController;

Route::post('/login', [AuthController::class, 'login']);
Route::get('/ping', fn() => response()->json(['status' => 'ok']));

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::post('/logout', [AuthController::class, 'logout']);

    // Admin Routes
    Route::get('/admin/stats', [AdminController::class, 'getStats']);
    Route::get('/admin/events', [AdminController::class, 'getEvents']);
    Route::post('/admin/set-event', [AdminController::class, 'setEvent']);
    
    // Admin CRUD Events
    Route::post('/admin/events', [AdminController::class, 'createEvent']);
    Route::put('/admin/events/{id}', [AdminController::class, 'updateEvent']);
    Route::delete('/admin/events/{id}', [AdminController::class, 'deleteEvent']);

    // Admin Guest Import
    Route::post('/admin/guests/import', [AdminController::class, 'importGuests']);

    // Admin CRUD Users
    Route::get('/admin/users', [AdminController::class, 'getUsers']);
    Route::post('/admin/users', [AdminController::class, 'createUser']);
    Route::put('/admin/users/{id}', [AdminController::class, 'updateUser']);
    Route::delete('/admin/users/{id}', [AdminController::class, 'deleteUser']);

    // Guestbook Routes
    Route::get('/guests', [GuestbookController::class, 'index']);
    Route::post('/guests/import', [GuestbookController::class, 'importGuests']);
    Route::post('/check-in', [GuestbookController::class, 'checkIn']);
    Route::post('/manual-check-in', [GuestbookController::class, 'manualCheckIn']);
    Route::delete('/check-in/{guestId}', [GuestbookController::class, 'undoCheckIn']);
    Route::put('/check-in/{guestId}', [GuestbookController::class, 'updateCheckIn']);
});
