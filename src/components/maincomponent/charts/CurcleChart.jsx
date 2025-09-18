import React, { useContext } from 'react'
import ReactApexChart from 'react-apexcharts'
import { AdminContext } from '../../context/AdminContext';

const CurcleChart = () => {
    const { users, orders, orderCompleted, orderPending } = useContext(AdminContext);

    const [chartOptions] = React.useState({
        // series: [users.length, orders.length, coupons.length, 43, 22],
        series: [users.length, orders.length, orderCompleted.length, orderPending.length],
        options: {
            chart: {
                width: 280,
                type: 'pie',
            },
            labels: ['Users', 'Orders', 'Completed Orders', 'Pending Orders'],
            responsive: [
                {
                    breakpoint: 1080,
                    options: {
                        chart: {
                            width: 280,
                        },
                        legend: {
                            position: 'bottom',
                        },
                    },
                },
                {
                    breakpoint: 480,
                    options: {
                        chart: {
                            width: 280,
                        },
                        legend: {
                            position: 'bottom',
                        },
                    },
                },
            ],
        },
    });

    return (
        <div>
            <div id="chart">
                <ReactApexChart
                    options={chartOptions.options}
                    series={chartOptions.series}
                    type="pie"
                    width={400}
                />
            </div>
            {/* <div id="html-dist"></div> */}
        </div>
    );
};

export default CurcleChart