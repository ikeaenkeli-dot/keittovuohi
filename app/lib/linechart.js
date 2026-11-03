/*
    Bläkkisvuohi, a Telegram bot to help track estimated blood alcohol concentration.
    Copyright (C) 2017  Joonas Ulmanen

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
    linechart.js
    Library to easily draw linecharts.
    Rendered with Chart.js 4 on @napi-rs/canvas (prebuilt, no native compile needed).
*/

'use strict';

const { createCanvas } = require('@napi-rs/canvas');
const { Chart, registerables } = require('chart.js');
const log = require('loglevel').getLogger('system');

Chart.register(...registerables);
Chart.defaults.font.family = '"DejaVu Sans", "Liberation Sans", Arial, sans-serif';
Chart.defaults.color = '#333';

const WIDTH = 1024;
const HEIGHT = 728;

// Paint a white background so the PNG doesn't look black in dark mode Telegram
const whiteBackground = {
    id: 'whiteBackground',
    beforeDraw: (chart) => {
        const ctx = chart.ctx;
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, chart.width, chart.height);
        ctx.restore();
    }
};

const linechart = module.exports = {};

function buildConfig(data, title) {
    return {
        type: 'line',
        data: {
            labels: (data && Array.isArray(data.labels)) ? data.labels : [],
            datasets: (data && Array.isArray(data.datasets)) ? data.datasets : []
        },
        options: {
            responsive: false,
            animation: false,
            devicePixelRatio: 1,
            elements: {
                line: {
                    tension: 0.4
                },
                point: {
                    radius: 2
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: title || '',
                    font: {
                        size: 20
                    }
                },
                legend: {
                    labels: {
                        // Prediction datasets have an empty label, hide them from legend
                        filter: (item) => !!item.text
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Aika'
                    }
                },
                y: {
                    display: true,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Promillet'
                    }
                }
            }
        },
        plugins: [whiteBackground]
    };
}

linechart.getLineGraphBuffer = function(data, title) {
    log.debug('Trying to make a line chart from data');
    try {
        const canvas = createCanvas(WIDTH, HEIGHT);
        const chart = new Chart(canvas.getContext('2d'), buildConfig(data, title));
        const buffer = canvas.toBuffer('image/png');
        chart.destroy();
        log.debug('Drawing line chart succeeded');
        return Promise.resolve(buffer);
    } catch (err) {
        log.error('Error writing PNG to buffer:');
        log.error(err);
        return Promise.reject(err);
    }
};
