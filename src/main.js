const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")

const size = 50

// Constants
const secondsOrdering = {mean: 10, standardDeviation: 5}
const secondsDecidingFood = {mean: 5 * 60, standardDeviation: 3 * 60}
const secondsEatingFood = {mean: 15 * 60, standardDeviation: 5 * 60}
const secondsEatingDesert = {mean: 10 * 60, standardDeviation: 3 * 60}
const secondsPaying = {mean: 30, standardDeviation: 10}

const wage = 10

const door = {x: 300, y: 500}
const kitchen = {x: 550, y: 50}
const staffSendsOrdersRemotely = false

// Reset by initialzeSimulation
let tables = []
let staff = []
let drinks = []
let foods = []
let deserts = []
let groups = {}
let nextGroupId = 0
let income = 0

////////

// per group member
let secondsDurationGiveOrder = 5;
let secondsDecideFood = 5;


function distance(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

function nearest(location1) {
    return (location2, location3) => {
        return distance(location1, location2) < distance(location1, location3) ? -1 : 1
    }
}

function smallest(table1, table2) {
    return table1.size <= table2.size ? -1 : 1
}

function sorted(array, f) {
    const result = [...array]
    result.sort(f)
    return result
}

function directionalUnitVector(from, to) {
    const d = distance(from, to)
    return [(to.x - from.x) / d, (to.y - from.y) / d]
}

const pixelsPerMeter = 100
const v = 1.4 * pixelsPerMeter

function moveTowards(mover, target) {
    const d = v * dt
    const dist = distance(mover, target)

    if (dist < d) {
        mover.x = target.x
        mover.y = target.y
    } else {
        const [dx, dy] = directionalUnitVector(mover, target)

        mover.x += d * dx
        mover.y += d * dy
    }
}

function drawTables() {
    ctx.fillStyle = "black"
    tables.forEach((table, i) => {

        const top = table.y - size / 2
        const left = table.x - size / 2

        ctx.strokeRect(left, top, size, size)

        ctx.textBaseline = "top";
        ctx.textAlign = "left";
        ctx.font = `${Math.round(size / 4)}px Arial`;
        ctx.fillText(i, left + 2, top + 2)

        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.font = `${Math.round(size / 2)}px Arial`;
        ctx.fillText(table.size, table.x, table.y)
    })
}

function drawStaff() {

    staff.forEach(({x, y}, i) => {
        const top = y - size / 2
        const left = x - size / 2

        ctx.fillStyle = "orange";
        ctx.fillRect(left, top, size, size)

        ctx.fillStyle = "black"
        ctx.textBaseline = "top";
        ctx.textAlign = "left";
        ctx.font = `${Math.round(size / 4)}px Arial`;
        ctx.fillText(i, left + 2, top + 2)

        // additional info
        ctx.fillText(getStaffTask(i), left + 2, top + 16)

    })
}

function getStaffTask(id) {
    const task = staff.filter(s => s.id === id)[0].task

    return task ? task.constructor.name : "Idling"
}

function getGroupStaff(group) {
    const table = tables.filter(t => t.group != null && t.group.id === group.id)

    if (table.length === 0) {
        return "No Table"
    }

    const s = staff.filter(s => s.task != null && s.task.table !== undefined && s.task.table.id === table[0].id)

    return s.length > 0 ? "Staff #" + s[0].id : "No Staff"
}

function getGroupTask(group) {
    for (const taskId in Task.taken) {
        const task = Task.taken[taskId]

        if (task.table === undefined || task.table === null) {
            continue
        }

        if (task.table.group === undefined) {
            continue
        }

        if (task.table.group.id === group.id) {
            return task.constructor.name;
        }
    }
    return "No Task"
}

function drawGroups() {
    for (const id in groups) {
        const group = groups[id]
        const {x, y} = group

        const top = y - size / 2
        const left = x - size / 2

        ctx.fillStyle = "DarkSeaGreen";
        ctx.fillRect(left, top, size, size)

        ctx.fillStyle = "black"
        ctx.textBaseline = "top";
        ctx.textAlign = "left";
        ctx.font = `${Math.round(size / 4)}px Arial`;
        ctx.fillText(id, left + 2, top + 2)
        ctx.fillText(group.size, left + size - 10, top + 2)
        ctx.fillText(getGroupStaff(group), left + 2, top + 18)
        ctx.fillText(getGroupTask(group), left + 2, top + 30)
    }
}

function drawKitchen() {
    const {x, y} = kitchen

    const top = y - size / 2
    const left = x - size / 2

    ctx.strokeStyle = "black";
    ctx.strokeRect(left, top, size, size)

    ctx.fillStyle = "black"
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.font = `${Math.round(size / 2)}px Arial`;
    ctx.fillText('K', x, y)
}

function drawEntranceExit() {
    const {x, y} = door

    const top = y - size / 2
    const left = x - size / 2

    ctx.strokeStyle = "black";
    ctx.strokeRect(left, top, size, size)

    ctx.fillStyle = "black"
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.font = `${Math.round(size / 2)}px Arial`;
    ctx.fillText('E', x, y)
}

function poisson(average, numSteps) {
    return Math.round(-Math.log(1 - Math.random()) / (average / numSteps))
}

function randomFromNormalDistribution({mean, standardDeviation}) {
    // Box-Muller method
    return mean + standardDeviation * Math.sqrt(-2.0 * Math.log(Math.random())) * Math.cos(2.0 * Math.PI * Math.random())
}

let secondsToSimulate = 1//4 * 3600
const FPS = 25
const dt = 1 / FPS
const stepsToSimulate = secondsToSimulate * FPS
const averageGroups = 999999999

let stepNextGroupArrives;

let intervalHandle = null

let groupSizes = [[2, 0.5], [3, 0.2], [4, 0.3]].map(([size, probability]) => {
    return {size, probability}
})

function selectRandom(things) {
    const p = Math.random()
    let totalP = 0;

    for (const thing of things) {
        totalP += thing.probability

        if (p <= totalP) {
            return thing
        }
    }
}

function repeat(n, f) {
    for (let i = 0; i < n; i++) {
        f()
    }
}

let initialGroups = 3

function createGroup() {

    if (currentStep >= stepsToSimulate) return

    const id = nextGroupId++
    const group = {
        x: door.x,
        y: door.y,
        id: id,
        size: selectRandom(groupSizes).size,
        orderedItems: [],
        stepsOrdering: randomFromNormalDistribution(secondsOrdering) * FPS,
        stepsDecidingFood: randomFromNormalDistribution(secondsDecidingFood) * FPS,
        stepsEatingFood: randomFromNormalDistribution(secondsEatingFood) * FPS,
        stepsEatingDesert: randomFromNormalDistribution(secondsEatingDesert) * FPS,
        stepsPaying: randomFromNormalDistribution(secondsPaying) * FPS
    }
    groups[group.id] = group

    new TaskSit(group)

    return group
}

function destroyGroup(group) {
    delete groups[group.id]
}

function transformMenuItems(items, type) {
    return items.map(([name, probability, profit, seconds]) => {
        return {type, name, probability, profit, seconds}
    })
}

function initializeSimulation() {
    currentStep = 0
    stepNextGroupArrives = poisson(averageGroups, stepsToSimulate)

    Task.initialize()
    TaskSit.initialize()
    TaskOrderDrinks.initialize()
    TaskOrderFood.initialize()
    TaskOrderDesert.initialize()
    TaskDeliverOrderToKitchen.initialize()
    TaskPrepareItemInKitchen.initialize()
    TaskDeliverOrderToTable.initialize()
    TaskPay.initialize()

    income = 0;

    tables = [
        [50, 50, 4],
        [150, 50, 3],
        [250, 150, 2],
        [350, 50, 2],
    ]
    tables = tables.map(([x, y, size], id) => {
        const group = null
        return {x, y, size, group, id}
    })

    const allTables = new Set(tables.map(table => table.id))

// TODO: do not accept more guests after, but keep going until no more groups.

    staff = [
        [500, 50, [], wage, false, false, false, true, false, false],
        [500, 100, [], wage, false, false, false, false, true, true],
        [550, 100, [], wage, false, false, false, false, true, true],
        [550, 150, [], wage, false, false, true, false, false, false],
        [550, 200, [0, 1], wage, false, true, false, false, false, false],
        [550, 250, [2, 3], wage, false, true, false, false, false, false],
        [550, 300, [], wage, false, true, false, false, false, false],
        [225, 425, [], wage, true, false, false, false, false, false],
        [375, 425, [], wage, true, false, false, false, false, false],
    ]
    staff = staff.map(([x, y, tablesArray, wage, doesTaskSeat, doesTaskTakeOrder, doesTaskDeliverOrder, doesTaskPrepareDrink, doesTaskPrepareFood, doesTaskPrepareDesert], id) => {
        const tables = tablesArray.length === 0 ? allTables : new Set(tablesArray)
        const task = null
        const idleLocation = {x: x, y: y}
        const stepsIdle = 0
        return {
            id,
            x,
            y,
            idleLocation,
            tables,
            wage,
            doesTaskSeat,
            doesTaskTakeOrder,
            doesTaskDeliverOrder,
            doesTaskPrepareDrink,
            doesTaskPrepareFood,
            doesTaskPrepareDesert,
            task,
            stepsIdle
        }
    })

    drinks = [
        ["Cola", 0.5, 1.5, 2],
        ["Martini", 0.5, 2, 6],
    ]
    drinks = transformMenuItems(drinks, "drink")

    foods = [
        ["Rice", 0.5, 3, 10],
        ["Potatoes", 0.5, 4, 15],
    ]
    foods = transformMenuItems(foods, "food")

    deserts = [
        ["Coffee", 0.5, 2, 10],
        ["Ice cream", 0.5, 2, 5],
    ]
    deserts = transformMenuItems(deserts, "desert")

    nextGroupId = 0
    groups = {}
    repeat(initialGroups, createGroup)

    window.clearInterval(intervalHandle)
    intervalHandle = null

    draw()
}

function doStep() {

    if (currentStep >= stepNextGroupArrives) {
        // spawn group
        createGroup()

        stepNextGroupArrives = currentStep + poisson(averageGroups, stepsToSimulate)
    }

    // do not seat new groups after closing
    if (currentStep >= stepsToSimulate) {
        for (const id in TaskSit.open) {
            const task = TaskSit.open[id]

            destroyGroup(task.group)
            delete TaskSit.open[task.id]
        }
    }

    // continue tasks

    for (const id in Task.taken) {
        const task = Task.taken[id]

        task.doStep()
    }

    // assign new tasks
    for (const id in TaskSit.open) {
        const task = TaskSit.open[id]

        const availableStaff = staff.filter(s => s.task == null && s.doesTaskSeat)
        if (availableStaff.length === 0) continue;

        for (const nearestStaff of sorted(availableStaff, nearest(task.group))) {

            const availableTables = tables.filter(table => table.group == null && table.size >= task.group.size && nearestStaff.tables.has(table.id))
            if (availableTables.length === 0) continue;

            let smallestAvailableTables = []

            for (const table of availableTables) {
                if (smallestAvailableTables.length === 0) {
                    smallestAvailableTables.push(table)
                } else if (table.size === smallestAvailableTables[0].size) {
                    smallestAvailableTables.push(table)
                } else if (table.size < smallestAvailableTables[0].size) {
                    smallestAvailableTables = [table]
                }
            }

            const neareastTable = sorted(smallestAvailableTables, nearest(task.group))[0]

            //console.log(`Seating group ${task.group.id}, staff ${nearestStaff.id} at table ${neareastTable.id}.`)

            task.table = neareastTable
            task.staff = nearestStaff

            task.staff.task = task
            task.table.group = task.group

            delete TaskSit.open[task.id]
            Task.taken[task.id] = task

            break;
        }
    }

    for (const id in TaskOrderDrinks.open) {
        const task = TaskOrderDrinks.open[id]

        const availableStaff = staff.filter(s => s.task == null && s.doesTaskTakeOrder && s.tables.has(task.table.id))
        if (availableStaff.length === 0) continue;

        const nearestStaff = sorted(availableStaff, nearest(task.table))[0]

        //console.log(`Taking drinks order from table ${task.table.id}, staff ${nearestStaff.id}.`)

        task.staff = nearestStaff
        task.staff.task = task

        delete TaskOrderDrinks.open[task.id]
        Task.taken[task.id] = task
    }

    for (const id in TaskOrderFood.open) {
        const task = TaskOrderFood.open[id]

        const availableStaff = staff.filter(s => s.task == null && s.doesTaskTakeOrder && s.tables.has(task.table.id))
        if (availableStaff.length === 0) continue;

        const nearestStaff = sorted(availableStaff, nearest(task.table))[0]

        //console.log(`Taking food order from table ${task.table.id}, staff ${nearestStaff.id}.`)

        task.staff = nearestStaff
        task.staff.task = task

        delete TaskOrderFood.open[task.id]
        Task.taken[task.id] = task
    }

    for (const id in TaskOrderDesert.open) {
        const task = TaskOrderDesert.open[id]

        const availableStaff = staff.filter(s => s.task == null && s.doesTaskTakeOrder && s.tables.has(task.table.id))
        if (availableStaff.length === 0) continue;

        const nearestStaff = sorted(availableStaff, nearest(task.table))[0]

        //console.log(`Taking desert order from table ${task.table.id}, staff ${nearestStaff.id}.`)

        task.staff = nearestStaff
        task.staff.task = task

        delete TaskOrderDesert.open[task.id]
        Task.taken[task.id] = task
    }

    for (const id in TaskPay.open) {
        const task = TaskPay.open[id]

        const availableStaff = staff.filter(s => s.task == null && s.doesTaskTakeOrder && s.tables.has(task.table.id))
        if (availableStaff.length === 0) continue;

        const nearestStaff = sorted(availableStaff, nearest(task.table))[0]

        //console.log(`Taking desert order from table ${task.table.id}, staff ${nearestStaff.id}.`)

        task.staff = nearestStaff
        task.staff.task = task

        delete TaskPay.open[task.id]
        Task.taken[task.id] = task
    }

    for (const id in TaskPrepareItemInKitchen.open) {
        const task = TaskPrepareItemInKitchen.open[id]

        const availableStaff = staff.filter(s => s.task == null && canPrepareItem(s, task.item))
        if (availableStaff.length === 0) continue;

        const nearestStaff = sorted(availableStaff, nearest(kitchen))[0]

        task.staff = nearestStaff
        task.staff.task = task

        delete TaskPrepareItemInKitchen.open[task.id]
        Task.taken[task.id] = task
    }

    for (const id in TaskDeliverOrderToKitchen.open) {
        const task = TaskDeliverOrderToKitchen.open[id]

        if (task.staff.task != null) continue;

        //console.log(`Deliver order by table ${task.order.table.id}, staff ${task.staff.id}.`)

        task.staff.task = task

        delete TaskDeliverOrderToKitchen.open[task.id]
        Task.taken[task.id] = task
    }

    for (const id in TaskDeliverOrderToTable.open) {
        const task = TaskDeliverOrderToTable.open[id]

        const availableStaff = staff.filter(s => s.task == null && s.doesTaskDeliverOrder)
        if (availableStaff.length === 0) continue;

        const nearestStaff = sorted(availableStaff, nearest(kitchen))[0]

        //console.log(`Deliver items to table ${task.order.table.id}, staff ${nearestStaff.id}.`)

        task.staff = nearestStaff
        task.staff.task = task

        delete TaskDeliverOrderToTable.open[task.id]
        Task.taken[task.id] = task
    }

    // idle staff
    for (const s of staff) {
        if (!s.task) {
            if (currentStep < stepsToSimulate) {
                s.stepsIdle++
            }

            moveTowards(s, s.idleLocation)
        }
    }

    currentStep++
}

/**
 * Draws all the stuff to the canvas.
 */
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    drawTables()
    drawKitchen()
    drawEntranceExit()
    drawGroups()
    drawStaff()

    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.font = `12px Arial`;
    ctx.fillText(Math.floor(currentStep / FPS), 2, 2)
}

let timeScale = 1

/**
 * Whether the simulation should continue.
 * Returns false if any one of two conditions is true:
 * - There are no remaining groups who want a table.
 * - The current time is above the simulated time.
 *
 * @return {boolean} true when the simulation should continue, false if it should stop.
 */
function shouldStep() {
    return currentStep < stepsToSimulate || Object.keys(groups).length > 0
}

/**
 * Frame drawing logic. Gets called every `dt` s.
 */
function drawFrame() {
    for (let i = 0; i < timeScale; i++) {
        if (shouldStep()) {
            doStep()
        } else {
            printMetrics()
            window.clearInterval(intervalHandle)
            intervalHandle = null
        }

    }

    draw()
}

document.getElementById("play").addEventListener("click", () => {
    intervalHandle = window.setInterval(drawFrame, 1000 * dt)
})

document.getElementById("pause").addEventListener("click", () => {
    window.clearInterval(intervalHandle)
    intervalHandle = null
})

document.getElementById("reset").addEventListener("click", () => {
    initializeSimulation()
})

initializeSimulation()