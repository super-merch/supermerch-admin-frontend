import React, { useContext } from "react";
import Chart from "react-apexcharts";
import { AdminContext } from "../../context/AdminContext";

const bucketConfig = [
  { id: "0-30", label: "0-30 days", test: (days) => days <= 30 },
  {
    id: "31-90",
    label: "31-90 days",
    test: (days) => days >= 31 && days <= 90,
  },
  {
    id: "91-180",
    label: "91-180 days",
    test: (days) => days >= 91 && days <= 180,
  },
  {
    id: "181-365",
    label: "181-365 days",
    test: (days) => days >= 181 && days <= 365,
  },
  {
    id: "365+",
    label: "365+ days",
    test: (days) => days > 365 || Number.isNaN(days),
  },
];

const getLatestOrderDate = (user) => {
  // Prefer orders array if present
  if (user?.orders?.length) {
    const latest = user.orders.reduce((latestDate, order) => {
      const orderDate = order?.orderDate ? new Date(order.orderDate) : null;
      if (!orderDate || Number.isNaN(orderDate.getTime())) return latestDate;
      if (!latestDate || orderDate > latestDate) return orderDate;
      return latestDate;
    }, null);
    if (latest) return latest;
  }

  return null;
};

export default function UserOrderRecencyChart({ height = 300 }) {
  const { users = [] } = useContext(AdminContext);

  const bucketCounts = bucketConfig.reduce((acc, bucket) => {
    acc[bucket.id] = 0;
    return acc;
  }, {});

  const now = Date.now();

  users.forEach((user) => {
    const lastOrderDate = getLatestOrderDate(user);
    const daysSince =
      lastOrderDate && lastOrderDate.getTime
        ? Math.floor((now - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24))
        : Number.NaN;

    const bucket = bucketConfig.find((b) => b.test(daysSince));
    if (bucket) {
      bucketCounts[bucket.id] = (bucketCounts[bucket.id] || 0) + 1;
    }
  });

  const series = [
    {
      name: "Users",
      data: bucketConfig.map((b) => bucketCounts[b.id] || 0),
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
      categories: bucketConfig.map((b) => b.label),
      title: {
        text: "Days since last order",
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
          colors: Array(bucketConfig.length).fill("#6b7280"),
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
        text: "Number of users",
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
    colors: ["#0ea5e9"],
    tooltip: {
      y: {
        formatter: (val) => `${val} user${val === 1 ? "" : "s"}`,
      },
    },
  };

  return <Chart options={options} series={series} type="bar" height={height} />;
}
