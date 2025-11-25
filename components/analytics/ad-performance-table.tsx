"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MousePointerClick, Eye, TrendingUp } from "lucide-react";
import Link from "next/link";

interface AdPerformanceItem {
  id: string;
  title: string;
  clicks: number;
  impressions: number;
  ctr: string;
  zone: string;
  isActive: boolean;
}

interface AdPerformanceTableProps {
  data: AdPerformanceItem[];
}

export function AdPerformanceTable({ data }: AdPerformanceTableProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Advertisement Performance</CardTitle>
          <CardDescription>Click-through rates and impressions</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No advertisement data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Advertisement Performance
        </CardTitle>
        <CardDescription>Click-through rates and impressions by advertisement</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Zone</TableHead>
              <TableHead className="text-right">Clicks</TableHead>
              <TableHead className="text-right">Impressions</TableHead>
              <TableHead className="text-right">CTR</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Link
                    href={`/dashboard/advertisements/${item.id}/edit`}
                    className="font-medium hover:underline"
                  >
                    {item.title}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{item.zone}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{item.clicks}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{item.impressions}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={parseFloat(item.ctr) > 2 ? "default" : "secondary"}>
                    {item.ctr}%
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={item.isActive ? "default" : "secondary"}>
                    {item.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

