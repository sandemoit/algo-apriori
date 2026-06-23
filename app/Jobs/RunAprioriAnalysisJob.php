<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\AprioriAnalysisRun;
use App\Services\AprioriService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class RunAprioriAnalysisJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 2;

    public function __construct(public readonly int $analysisRunId) {}

    public function handle(AprioriService $service): void
    {
        $run = AprioriAnalysisRun::query()->find($this->analysisRunId);
        if ($run === null) {
            return;
        }

        $service->execute($run);
    }
}
