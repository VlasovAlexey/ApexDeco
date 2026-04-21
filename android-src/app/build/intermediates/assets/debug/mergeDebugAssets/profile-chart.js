/**
 * ApexDeco - Dive Profile Chart
 * Uses Highcharts area chart with gas switch markers
 */

function drawProfileChart(containerId, result) {
    if (!result || !result.plan || result.plan.length === 0) return;
    if (typeof Highcharts === 'undefined') return;

    // Apply light theme
    Highcharts.setOptions(ChartThemeLight());

    const plan = result.plan;
    const unit = result.depthUnit || 'm';

    // Build chart data from plan segments
    const chartLineArr = [];
    const chartZoneArr = [];
    const chartLabelArr = [];

    let currentTime = 0;
    let colorTick = 0;
    const zoneColors = ['#40c0ca', '#1d99ff'];
    let lastGas = null;
    let prevDepth = 0;

    // Find max depth for title
    let maxDepth = 0;
    for (const seg of plan) {
        const d = seg.depth || seg.endDepth || seg.startDepth || 0;
        if (d > maxDepth) maxDepth = d;
    }

    // Get deco ascent rate for transitions between stops
    const decoAscentRate = (appState && appState.settings)
        ? (appState.settings.decoAscentRate || 9)
        : 9;
    const surfaceAscentRate = (appState && appState.settings)
        ? (appState.settings.surfaceAscentRate || 9)
        : 9;

    for (let i = 0; i < plan.length; i++) {
        const seg = plan[i];
        const segTime = seg.time || 0;
        const gas = seg.gas || '--';

        // Determine start and end depths for this segment
        let startDepth, endDepth;
        switch (seg.type) {
            case 'descent':
                startDepth = seg.startDepth || 0;
                endDepth = seg.endDepth || 0;
                break;
            case 'ascent':
                startDepth = seg.startDepth || 0;
                endDepth = seg.endDepth || 0;
                break;
            case 'bottom':
            case 'stop':
                startDepth = seg.depth || 0;
                endDepth = seg.depth || 0;
                break;
            case 'surface':
                startDepth = 0;
                endDepth = 0;
                break;
            default:
                startDepth = seg.depth || seg.startDepth || 0;
                endDepth = seg.depth || seg.endDepth || 0;
        }

        // Insert ascent transition between consecutive stops (or from stop to surface)
        if (prevDepth > startDepth && i > 0) {
            const prevSeg = plan[i - 1];
            if (prevSeg.type === 'stop' || prevSeg.type === 'bottom') {
                const rate = (seg.type === 'surface') ? surfaceAscentRate : decoAscentRate;
                const transitTime = (prevDepth - startDepth) / rate;
                // Diagonal ascent line from previous depth to this depth
                chartLineArr.push({
                    x: parseFloat(currentTime.toFixed(4)),
                    y: prevDepth * -1
                });
                currentTime += transitTime;
                chartLineArr.push({
                    x: parseFloat(currentTime.toFixed(4)),
                    y: startDepth * -1
                });
            }
        }

        // Gas switch label
        if (gas !== '--' && gas !== lastGas) {
            chartLabelArr.push({
                x: currentTime,
                title: gas,
                text: gas
            });

            // A zone's `value` is its upper bound and `color` applies BEFORE it.
            // Push a zone that closes the previous gas segment with the CURRENT
            // colorTick, then flip the tick so the next gas uses the other color.
            if (lastGas !== null) {
                chartZoneArr.push({
                    value: currentTime,
                    color: zoneColors[colorTick]
                });
                colorTick = colorTick === 0 ? 1 : 0;
            }
            lastGas = gas;
        }

        // Add start point
        chartLineArr.push({
            x: parseFloat(currentTime.toFixed(4)),
            y: startDepth * -1
        });

        currentTime += segTime;

        // Add end point
        chartLineArr.push({
            x: parseFloat(currentTime.toFixed(4)),
            y: endDepth * -1
        });

        prevDepth = endDepth;
    }

    // Final zone color to cover the rest of the chart
    chartZoneArr.push({
        value: 100000,
        color: zoneColors[colorTick]
    });

    // Chart colors for light theme (matching DiveProMe)
    const colorsCustom = ['#f45b5b', '#8085e9'];

    // Build the chart
    Highcharts.chart(containerId, {
        navigation: {
            buttonOptions: {
                enabled: false
            }
        },
        chart: {
            resetZoomButton: {
                position: {
                    align: 'center',
                    x: 0
                },
                theme: {
                    fill: '#ffffff',
                    stroke: '#cccccc',
                    style: {
                        color: '#333333',
                        fontWeight: 'bold'
                    },
                    r: 4,
                    states: {
                        hover: {
                            stroke: '#999999',
                            fill: '#e6e6e6',
                            style: {
                                color: '#000000'
                            }
                        }
                    }
                }
            },
            marginTop: 80,
            zoomType: 'xy'
        },
        credits: {
            enabled: false
        },
        legend: {
            enabled: false
        },
        title: {
            text: 'Depth ' + maxDepth + unit
        },
        subtitle: {
            text: 'ApexDeco'
        },
        xAxis: {
            allowDecimals: false,
            title: {
                text: 'Time'
            },
            labels: {
                formatter: function () {
                    return this.value + ' min';
                }
            }
        },
        yAxis: {
            title: {
                text: 'Depth'
            },
            labels: {
                formatter: function () {
                    return (this.value * -1) + unit;
                }
            }
        },
        tooltip: {
            formatter: function () {
                return '<span>Time: ' + parseInt(this.x) + ' min</span>' +
                    '<br><b>Depth: ' + (-1 * this.y) + unit + '</b>';
            },
            split: true,
            shared: true,
            useHTML: true
        },
        plotOptions: {
            series: {
                animation: false
            }
        },
        exporting: {
            buttons: {
                contextButton: {
                    menuItems: null,
                    onclick: function () {
                        this.print();
                    }
                }
            },
            chartOptions: {
                chart: {
                    style: {
                        fontFamily: 'Arial'
                    }
                }
            }
        },
        colors: colorsCustom,
        series: [{
            id: 'main_series',
            type: 'area',
            name: 'Depth',
            data: chartLineArr,
            zoneAxis: 'x',
            zones: chartZoneArr
        }, {
            type: 'flags',
            name: 'Gas',
            data: chartLabelArr,
            onSeries: 'main_series',
            shape: 'squarepin'
        }]
    });
}
