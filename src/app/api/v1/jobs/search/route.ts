import { listJobs } from "@/modules/jobs/job-catalog";
import { jobSearchFiltersSchema } from "@/modules/jobs/job-schema";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const filters = jobSearchFiltersSchema.parse(body);

  const jobs = listJobs().filter((job) => {
    if (filters.title && !job.title.toLowerCase().includes(filters.title.toLowerCase())) {
      return false;
    }

    if (
      filters.keyword &&
      !`${job.title} ${job.company} ${job.summary}`
        .toLowerCase()
        .includes(filters.keyword.toLowerCase())
    ) {
      return false;
    }

    if (filters.company && !job.company.toLowerCase().includes(filters.company.toLowerCase())) {
      return false;
    }

    if (filters.location && !job.location.toLowerCase().includes(filters.location.toLowerCase())) {
      return false;
    }

    if (filters.workplace && job.workplace !== filters.workplace) {
      return false;
    }

    if (typeof filters.salaryMin === "number" && job.salaryMax < filters.salaryMin) {
      return false;
    }

    if (typeof filters.salaryMax === "number" && job.salaryMin > filters.salaryMax) {
      return false;
    }

    if (filters.jobType && job.jobType !== filters.jobType) {
      return false;
    }

    if (filters.industry && job.industry !== filters.industry) {
      return false;
    }

    if (filters.experienceLevel && job.experienceLevel !== filters.experienceLevel) {
      return false;
    }

    if (filters.schedule && job.schedule !== filters.schedule) {
      return false;
    }

    if (filters.benefits.length > 0 && !filters.benefits.every((benefit) => job.benefits.includes(benefit))) {
      return false;
    }

    if (filters.visaStatus && job.visaStatus !== filters.visaStatus) {
      return false;
    }

    if (typeof filters.postingAgeDays === "number" && job.postingAgeDays > filters.postingAgeDays) {
      return false;
    }

    if (
      filters.fitGoals.length > 0 &&
      !filters.fitGoals.every((goal) => job.fitGoals.includes(goal))
    ) {
      return false;
    }

    return true;
  });

  return NextResponse.json({ jobs });
}
