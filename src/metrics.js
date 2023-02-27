/**
 * Calculates the metrics for this run.
 *
 * @return {{income: number, wages: *, staff: *, wastedWages: *, profit: number}} a map of metrics.
 */
function calculateMetrics() {
    const s = staff.map(s => ({
        id: s.id,
        uptime: 1 - (s.stepsIdle / stepsToSimulate),
        wastedWage: s.wage * (s.stepsIdle / FPS) / 3600
    }));
    const wastedWages = s.map(s => s.wastedWage).reduce((a, b) => a + b, 0)
    const wages = staff.map(s => s.wage * secondsToSimulate / 3600).reduce((a, b) => a + b, 0)

    return {
        income: income,
        wages: wages,
        staff: s,
        wastedWages: wastedWages,
        profit: income - wages
    }
}

/**
 * Prints the metrics to the console in JSON format.
 */
function printMetrics() {
    console.log(JSON.stringify(calculateMetrics(), null, 2))
}