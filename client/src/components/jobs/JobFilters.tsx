import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';

import { JOB_TYPES } from '@/components/jobs/filterJobs';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { JOB_TYPE_LABELS } from '@/lib/format';
import type { JobSummary, JobType } from '@/types/api';

interface JobFiltersProps {
  jobs: JobSummary[];
  selectedTypes: JobType[];
  onTypesChange: (types: JobType[]) => void;
  idPrefix?: string;
}

export function MobileJobFilters(props: JobFiltersProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="min-h-11 lg:hidden">
          <SlidersHorizontal aria-hidden="true" className="size-4" />
          Filter
          {props.selectedTypes.length > 0
            ? ` (${props.selectedTypes.length})`
            : ''}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="flex flex-col data-[side=left]:w-[min(90vw,360px)]"
      >
        <SheetHeader>
          <SheetTitle>Sesuaikan pencarian</SheetTitle>
          <SheetDescription>
            Pilih tipe pekerjaan yang Anda cari.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <JobFilters {...props} idPrefix="mobile" />
        </div>
        <SheetFooter>
          <Button className="min-h-11 w-full" onClick={() => setOpen(false)}>
            Tampilkan lowongan
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function JobFilters({
  jobs,
  selectedTypes,
  onTypesChange,
  idPrefix = 'desktop',
}: JobFiltersProps) {
  function toggleType(jobType: JobType, checked: boolean) {
    const nextTypes = checked
      ? [...selectedTypes, jobType]
      : selectedTypes.filter((selectedType) => selectedType !== jobType);
    onTypesChange(nextTypes);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">Filter lowongan</h2>
        {selectedTypes.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="-mr-2 text-xs text-primary"
            onClick={() => onTypesChange([])}
          >
            <RotateCcw aria-hidden="true" className="size-3" /> Reset
          </Button>
        )}
      </div>
      <fieldset className="space-y-4">
        <legend className="mb-4 text-sm font-semibold">Tipe pekerjaan</legend>
        {JOB_TYPES.map((jobType) => (
          <div key={jobType} className="flex min-h-6 items-center gap-2.5">
            <Checkbox
              id={`${idPrefix}-job-type-${jobType}`}
              checked={selectedTypes.includes(jobType)}
              onCheckedChange={(checked) =>
                toggleType(jobType, checked === true)
              }
            />
            <Label
              htmlFor={`${idPrefix}-job-type-${jobType}`}
              className="flex flex-1 cursor-pointer items-center justify-between gap-2 text-sm font-normal"
            >
              {JOB_TYPE_LABELS[jobType]}
              <span className="tabular-nums text-muted-foreground">
                {jobs.filter((job) => job.jobType === jobType).length}
              </span>
            </Label>
          </div>
        ))}
      </fieldset>
      <div className="rounded-xl border bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
        Pencarian dan filter diterapkan pada seluruh lowongan yang tersedia saat
        ini.
      </div>
    </div>
  );
}
