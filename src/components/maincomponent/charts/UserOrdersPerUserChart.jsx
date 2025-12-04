import React, { useContext } from "react";
import Chart from "react-apexcharts";
import { AdminContext } from "../../context/AdminContext";

export default function UserOrdersPerUserChart({ height = 300 }) {
  const { users } = useContext(AdminContext);

  const buckets = [
    { id: "0-1", label: "0-1", test: (total) => total <= 1 },
    { id: "2-5", label: "2-5", test: (total) => total >= 2 && total <= 5 },
    { id: "5-10", label: "5-10", test: (total) => total >= 6 && total <= 10 },
    {
      id: "10-20",
      label: "10-20",
      test: (total) => total >= 11 && total <= 20,
    },
    { id: "20+", label: "20+", test: (total) => total >= 21 },
  ];

  const bucketCounts = buckets.reduce((acc, bucket) => {
    acc[bucket.id] = 0;
    return acc;
  }, {});

  users.forEach((user) => {
    const totalOrders = user?.orderStats?.totalOrders || 0;
    const bucket = buckets.find((b) => b.test(totalOrders));
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
      title: {
        text: "Number of orders per user",
        style: {
          fontSize: "11px",
          fontWeight: 500,
          color: "#4b5563",
        },
        offsetY: 6,
      },
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
      title: {
        text: "Number of customers",
        style: {
          fontSize: "11px",
          fontWeight: 500,
          color: "#4b5563",
        },
        offsetY: 6,
      },
      min: 0,
      forceNiceScale: true,
    },
    grid: {
      strokeDashArray: 4,
      borderColor: "#e5e7eb",
    },
    colors: ["#14b8a6"],
    tooltip: {
      y: {
        formatter: (val) => `${val} user${val === 1 ? "" : "s"}`,
      },
    },
  };

  return <Chart options={options} series={series} type="bar" height={height} />;
}
