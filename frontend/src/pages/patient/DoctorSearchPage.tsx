import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Award, X, Stethoscope } from 'lucide-react';
import { doctorApi } from '../../services/api';
import { DoctorProfile } from '../../types';
import { DoctorCard } from '../../components/DoctorCard';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';

export const DoctorSearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [specialization, setSpecialization] = useState(searchParams.get('specialization') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [availableToday, setAvailableToday] = useState(searchParams.get('availableToday') === 'true');
  const [minExperience, setMinExperience] = useState<number>(0);
  const [maxFee, setMaxFee] = useState<number>(2000);

  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const fetchDoctors = async () => {
    setIsLoading(true);
    try {
      const data = await doctorApi.listDoctors({
        search: search || undefined,
        specialization: specialization || undefined,
        location: location || undefined,
        availableToday: availableToday || undefined,
        minExperience: minExperience > 0 ? minExperience : undefined,
        maxFee: maxFee < 2000 ? maxFee : undefined
      });
      setDoctors(data);
    } catch (error) {
      console.error('Failed to search doctors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [specialization, availableToday, minExperience, maxFee]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDoctors();
  };

  const handleClearFilters = () => {
    setSearch('');
    setSpecialization('');
    setLocation('');
    setAvailableToday(false);
    setMinExperience(0);
    setMaxFee(2000);
    setSearchParams({});
    doctorApi.listDoctors({}).then(setDoctors);
  };

  const specialtiesList = [
    'All Specialties',
    'Cardiologist',
    'Dermatologist',
    'Pediatrician',
    'Neurologist',
    'General Medicine'
  ];

  const hasActiveFilters = Boolean(
    search || specialization || location || availableToday || minExperience > 0 || maxFee < 2000
  );

  return (
    <div className="page-container">
      {/* Top Search & Filter Bar */}
      <div className="page-header !flex-col !items-stretch space-y-3.5">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by doctor name, hospital, condition, or address..."
              className="form-input !pl-10 !pr-3.5 !py-2 text-sm"
            />
          </div>
          <Button type="submit" variant="primary" size="md">
            Search
          </Button>
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
            className="md:hidden"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
        </form>

        {/* Quick Filters Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setAvailableToday(!availableToday)}
            className={`badge-clinical badge-md transition-colors cursor-pointer ${
              availableToday
                ? 'badge-available !font-semibold'
                : 'badge-neutral hover:bg-slate-200'
            }`}
          >
            <span className={`badge-dot ${availableToday ? 'bg-emerald-600' : 'bg-slate-400'}`} />
            Available Today
          </button>

          <button
            type="button"
            onClick={() => setMinExperience(minExperience === 10 ? 0 : 10)}
            className={`badge-clinical badge-md transition-colors cursor-pointer ${
              minExperience === 10
                ? 'badge-brand !font-semibold'
                : 'badge-neutral hover:bg-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            10+ Yrs Experience
          </button>

          {/* Specialty Dropdown */}
          <select
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value === 'All Specialties' ? '' : e.target.value)}
            className="form-select !w-auto !py-1 text-xs cursor-pointer"
          >
            {specialtiesList.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="btn btn-ghost btn-sm text-slate-500 hover:text-slate-700"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Content: Results Count & Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <p className="font-heading text-xs font-bold text-slate-600">
            {isLoading ? 'Searching verified physicians...' : `Found ${doctors.length} Doctor${doctors.length === 1 ? '' : 's'}`}
          </p>
        </div>

        {isLoading ? (
          <LoadingSkeleton rows={3} />
        ) : doctors.length === 0 ? (
          <EmptyState
            icon={Stethoscope}
            title="No matching doctors found"
            description="Try changing your search terms, clearing active filters, or selecting another medical specialty."
            action={
              <Button variant="primary" onClick={handleClearFilters}>
                Clear All Filters
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {doctors.map((doctor) => (
              <DoctorCard key={doctor._id} doctor={doctor} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
