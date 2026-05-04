<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    protected $fillable = ['title', 'event_date', 'is_active'];

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function guests()
    {
        return $this->hasMany(Guest::class);
    }
}
