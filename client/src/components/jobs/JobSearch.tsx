import { MapPin, Search } from 'lucide-react';
import type { FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface JobSearchProps {
  keyword: string;
  location: string;
  onSearch: (keyword: string, location: string) => void;
}

export function JobSearch({ keyword, location, onSearch }: JobSearchProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onSearch(
      String(formData.get('keyword') ?? '').trim(),
      String(formData.get('location') ?? '').trim(),
    );
  }

  return (
    <section className="border-b bg-primary/[0.045]">
      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <p className="mb-2 text-xs font-semibold tracking-[0.15em] text-primary uppercase">
          Peluang baru, langkah baru
        </p>
        <h1 className="text-2xl leading-tight font-bold tracking-tight sm:text-3xl">
          Temukan pekerjaan yang tepat untuk Anda.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Jelajahi lowongan dan mulai perjalanan karier berikutnya bersama
          IndoKerja.
        </p>
        <form
          key={`${keyword}-${location}`}
          onSubmit={handleSubmit}
          role="search"
          className="mt-6 grid gap-3 rounded-2xl border bg-card p-3 shadow-xs sm:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_auto]"
        >
          <div className="relative">
            <Label htmlFor="keyword" className="sr-only">
              Posisi atau perusahaan
            </Label>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-3.5 left-3 size-4 text-muted-foreground"
            />
            <Input
              id="keyword"
              name="keyword"
              defaultValue={keyword}
              placeholder="Posisi atau perusahaan"
              className="min-h-11 border-0 bg-transparent pl-10 shadow-none"
              maxLength={200}
            />
          </div>
          <div className="relative sm:border-l">
            <Label htmlFor="location" className="sr-only">
              Lokasi pekerjaan
            </Label>
            <MapPin
              aria-hidden="true"
              className="pointer-events-none absolute top-3.5 left-3 size-4 text-muted-foreground"
            />
            <Input
              id="location"
              name="location"
              defaultValue={location}
              placeholder="Kota atau lokasi"
              className="min-h-11 border-0 bg-transparent pl-10 shadow-none"
              maxLength={200}
            />
          </div>
          <Button type="submit" className="min-h-11 px-6">
            <Search aria-hidden="true" className="size-4" />
            Cari lowongan
          </Button>
        </form>
      </div>
    </section>
  );
}
