<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Guest extends Model
{
    protected $fillable = ['event_id', 'name', 'category', 'address', 'is_unregistered'];

    protected $appends = ['is_attended'];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function attendance()
    {
        return $this->hasOne(Attendance::class);
    }

    public function getIsAttendedAttribute()
    {
        return $this->attendance !== null;
    }
}
