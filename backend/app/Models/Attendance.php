<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    protected $fillable = ['guest_id', 'user_id', 'pax', 'check_in_time'];

    public function guest()
    {
        return $this->belongsTo(Guest::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
