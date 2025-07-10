import React, { useContext } from 'react';
import Chart from 'react-apexcharts';
import { AdminContext } from '../../context/AdminContext';

const BarChart = () => {
    const { users, orders, orderCompleted } = useContext(AdminContext);

    const chartData = {
        series: [
            {
                name: 'Users',
                data: [users.length || 0, 0, 0]
            },
            {
                name: 'Orders',
                data: [0, orders.length || 0, 0]
            },
            {
                name: 'Complete Order',
                data: [0, 0, orderCompleted.length || 0]
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
            colors: ['#008FFB', '#00E396', '#FF4560'],
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
                categories: ['Users', 'Orders', 'Complete Order'],
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