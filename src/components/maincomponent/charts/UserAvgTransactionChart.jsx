import React, { useContext } from "react";
import Chart from "react-apexcharts";
import { AdminContext } from "../../context/AdminContext";

export default function UserAvgTransactionChart({ height = 300 }) {
  const { users } = useContext(AdminContext);

  const buckets = [
    { id: "0-250", label: "0-250", test: (avg) => avg > 0 && avg <= 250 },
    {
      id: "250-1k",
      label: "250-1k",
      test: (avg) => avg > 250 && avg <= 1000,
    },
    {
      id: "1k-5k",
      label: "1k-5k",
      test: (avg) => avg > 1000 && avg <= 5000,
    },
    {
      id: "5k-10k",
      label: "5k-10k",
      test: (avg) => avg > 5000 && avg <= 10000,
    },
    {
      id: "10k+",
      label: "10k+",
      test: (avg) => avg > 10000,
    },
  ];

  const bucketCounts = buckets.reduce((acc, bucket) => {
    acc[bucket.id] = 0;
    return acc;
  }, {});

  users.forEach((user) => {
    const totalOrders = user?.orderStats?.totalOrders || 0;
    const totalAmount = user?.orderStats?.totalAmount || 0;

    if (!totalOrders || !totalAmount) return;

    const avg = totalAmount / totalOrders;
    const bucket = buckets.find((b) => b.test(avg));
    if (bucket) {
      bucketCounts[bucket.id] = (bucketCounts[bucket.id] || 0) + 1;
    }
  });

  const series = [
    {
      name: "Users",
      data: buckets.map((b) => bucketCounts[b.id] || 0),
    },
  ];

  const options = {
    chart: {
      type: "bar",
      toolbar: { show: false },
      sparkline: { enabled: false },
      parentHeightOffset: 0,
    },
    plotOptions: {
      bar: {
        columnWidth: "45%",
        borderRadius: 4,
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: buckets.map((b) => b.label),
      labels: {
        show: true,
        style: {
          fontSize: "10px",
          colors: Array(buckets.length).fill("#6b7280"),
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        show: true,
        style: {
          fontSize: "10px",
          colors: ["#9ca3af"],
        },
      },
      min: 0,
      forceNiceScale: true,
    },
    grid: {
      strokeDashArray: 4,
      borderColor: "#e5e7eb",
    },
    colors: ["#6366f1"],
    tooltip: {
      y: {
        formatter: (val) => `${val} user${val === 1 ? "" : "s"}`,
      },
    },
  };

  return <Chart options={options} series={series} type="bar" height={height} />;
}
