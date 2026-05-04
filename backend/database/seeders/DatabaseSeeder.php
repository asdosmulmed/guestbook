<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $event = \App\Models\Event::firstOrCreate(
            ['title' => 'Romeo & Juliet Wedding'],
            ['event_date' => '2026-12-01', 'is_active' => true]
        );

        User::firstOrCreate(
            ['email' => 'admin@example.com'],
            ['name' => 'Admin User', 'password' => bcrypt('password'), 'role' => 'admin']
        );

        User::firstOrCreate(
            ['email' => 'receptionist@example.com'],
            ['name' => 'Receptionist 1', 'password' => bcrypt('password'), 'role' => 'receptionist', 'event_id' => $event->id]
        );

        \App\Models\Guest::firstOrCreate(['name' => 'John Doe', 'event_id' => $event->id], ['category' => 'VIP']);
        \App\Models\Guest::firstOrCreate(['name' => 'Jane Smith', 'event_id' => $event->id], ['category' => 'Regular']);
    }
}
