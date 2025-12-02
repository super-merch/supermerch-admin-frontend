import React, { useContext } from 'react';
import Chart from 'react-apexcharts';
import { AdminContext } from '../../context/AdminContext';

const BarChart = () => {
    const { users, orders, orderCompleted,orderCount } = useContext(AdminContext);

    const chartData = {
        series: [
            {
                name: 'Orders',
                data: [ orderCount.total || 0, 0,0]
            },
            {
                name: 'Complete Order',
                data: [0, orderCount.delivered || 0,0]
            },
            {
                name: 'Pending Order',
                data: [0, 0, orderCount.pending || 0]
            },
            {
                name: 'Cancelled Order',
                data: [0, 0,0, orderCount.cancelled ]
            }
        ],
        options: {
            chart: {
                type: 'bar',
                height: 350,
                toolbar: {
                    show: true
                }
            },
            colors: ['#008FFB', '#FEB019', '#00E396', '#775DD0',"#FF4560"],
            plotOptions: {
                bar: {
                    columnWidth: '45%',
                    distributed: true
                }
            },
            dataLabels: {
                enabled: false
            },
            legend: {
                show: true,
                position: 'bottom'
            },
            xaxis: {
                categories: [ 'Total Orders', 'Complete Order','Pending Order','Cancelled Order'],
                labels: {
                    style: {
                        fontSize: '14px'
                    }
                }
            },
            responsive: [
                {
                    breakpoint: 768,
                    options: {
                        chart: {
                            height: 300
                        },
                        plotOptions: {
                            bar: {
                                columnWidth: '70%'
                            }
                        },
                        xaxis: {
                            labels: {
                                style: {
                                    fontSize: '12px'
                                }
                            }
                        }
                    }
                },
                {
                    breakpoint: 480,
                    options: {
                        chart: {
                            height: 250
                        },
                        plotOptions: {
                            bar: {
                                columnWidth: '80%'
                            }
                        },
                        xaxis: {
                            labels: {
                                style: {
                                    fontSize: '10px'
                                }
                            }
                        },
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            ]
        }
    };

    return (
        <div id="chart" className='dark:text-black '>
            {chartData.series.length > 0 ? (
                <Chart
                    options={chartData.options}
                    series={chartData.series}
                    type="bar"
                    height={350} />
            ) : (
                <p>Loading chart...</p>
            )}
        </div>
    );
};

export default BarChart;