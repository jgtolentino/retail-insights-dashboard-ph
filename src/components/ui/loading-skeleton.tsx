/**
 * Loading Skeleton Components for Enhanced Performance
 */

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Base skeleton component
export function Skeleton({ className = '', ...props }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className}`} {...props} />;
}

// Dashboard overview skeleton
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[120px]" />
              <Skeleton className="mt-2 h-3 w-[80px]" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[200px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[200px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>

      {/* Additional Content */}
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-[150px]" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[80%]" />
              <Skeleton className="h-4 w-[60%]" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Chart skeleton
export function ChartSkeleton({ height = '300px' }: { height?: string }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-[200px]" />
      </CardHeader>
      <CardContent>
        <Skeleton className="w-full" style={{ height }} />
      </CardContent>
    </Card>
  );
}

// Table skeleton
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-[150px]" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Table header */}
          <div className="flex gap-4">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-[80px]" />
            <Skeleton className="h-4 w-[120px]" />
            <Skeleton className="h-4 w-[90px]" />
          </div>
          {/* Table rows */}
          {[...Array(rows)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-[80px]" />
              <Skeleton className="h-4 w-[120px]" />
              <Skeleton className="h-4 w-[90px]" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Analytics skeleton
export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Top metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-[120px]" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-8 w-[80px]" />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-[80px]" />
                  <Skeleton className="h-3 w-[40px]" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-[70px]" />
                  <Skeleton className="h-3 w-[50px]" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-[90px]" />
                  <Skeleton className="h-3 w-[30px]" />
                </div>
              </div>
              <Skeleton className="h-2 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>

      {/* Full width chart */}
      <ChartSkeleton height="400px" />
    </div>
  );
}

// Recommendations skeleton
export function RecommendationsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-[250px]" />
          <Skeleton className="h-8 w-[80px]" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Tabs skeleton */}
          <div className="flex gap-2">
            <Skeleton className="h-9 w-[120px]" />
            <Skeleton className="h-9 w-[100px]" />
            <Skeleton className="h-9 w-[110px]" />
          </div>

          {/* Recommendations list */}
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-3 rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-5 w-[200px]" />
                      <Skeleton className="h-5 w-[80px]" />
                    </div>
                    <Skeleton className="h-4 w-[300px]" />
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-[100px]" />
                      <Skeleton className="h-3 w-[250px]" />
                      <Skeleton className="h-3 w-[180px]" />
                      <Skeleton className="h-3 w-[220px]" />
                    </div>
                  </div>
                  <div className="space-y-2 text-right">
                    <Skeleton className="h-8 w-[60px]" />
                    <Skeleton className="h-3 w-[80px]" />
                    <Skeleton className="h-5 w-[70px]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Substitution flow skeleton
export function SubstitutionFlowSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-[200px]" />
          <Skeleton className="h-8 w-[100px]" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Flow visualization skeleton */}
          <div className="grid min-h-96 grid-cols-2 gap-8">
            {/* Original brands column */}
            <div className="space-y-2">
              <Skeleton className="mb-4 h-4 w-[150px]" />
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-5 w-[60px]" />
                  </div>
                </div>
              ))}
            </div>

            {/* Substitute brands column */}
            <div className="space-y-2">
              <Skeleton className="mb-4 h-4 w-[150px]" />
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-5 w-[60px]" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key insights skeleton */}
          <div className="border-t pt-4">
            <Skeleton className="mb-3 h-5 w-[180px]" />
            <div className="grid gap-3 md:grid-cols-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2 rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-[80px]" />
                    <Skeleton className="h-3 w-3" />
                    <Skeleton className="h-4 w-[80px]" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-3 w-[100px]" />
                    <Skeleton className="h-3 w-[80px]" />
                    <Skeleton className="h-3 w-[60px]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
