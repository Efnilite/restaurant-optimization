const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")

const size = 50

let secondsOrdering = {mean : 10, standardDeviation : 5}
let secondsDecidingFood = {mean : 5 * 60, standardDeviation : 3 * 60}
let secondsEatingFood = {mean : 15 * 60, standardDeviation : 5 * 60}
let secondsEatingDesert = {mean : 10 * 60, standardDeviation : 3 * 60}
let secondsPaying = {mean : 30, standardDeviation : 10}

// Reset by initialzeSimulation
let tables = []
let staff = []
let drinks = []
let foods = []
let deserts = []
let groups = {}
let nextGroupId = 0;
let wage = 10
let groupEntranceExit = { x: 300, y: 500 }
let kitchen = { x: 550, y: 50 }
let staffSendsOrdersRemotely = false
let income = 0;
////////

class Task {
  static taken;
  static nextId;

  static initialize() {
    Task.taken = {}
    Task.nextId = 0
  }

  id;
  stepCreated;
  currentPhase = 0
  phases = []
  staff;

  constructor() {
    this.stepCreated = currentStep
    this.id = Task.nextId++
  }

  done() {
    delete Task.taken[this.id]

    if (this.staff) {
      this.staff.task = null;
    }
  }

  nextPhase() { this.currentPhase += 1 }

  doStep() { this.phases[this.currentPhase]() }
}

// per drink
let secondsDurationDeliverDrink = 3;

class TaskDeliverItems extends Task {
  static open;
  static initialize() { TaskDeliverItems.open = {} }

  order;
  stepsDuration;

  constructor(order) {
    super()
    TaskDeliverItems.open[this.id] = this

    this.order = order;

    this.phases = [
      // 1: staff to kitchen
      () => {
        if (this.staff.x == kitchen.x && this.staff.y == kitchen.y) {
          this.nextPhase();
        } else {
          moveTowards(this.staff, kitchen)
        }
      },
      // 2: staff to table
      () => {
        if (this.staff.x == this.order.table.x && this.staff.y == this.order.table.y) {
          if (order.onDeliver) {
            order.onDeliver()
          }

          this.done()
        } else {
          moveTowards(this.staff, this.order.table)
        }
      }
    ]
  }
}

function calculateMetrics() {
  const s = staff.map(s=>{return {id: s.id, uptime : 1-(s.stepsIdle/stepsToSimulate), wastedWage : s.wage * (s.stepsIdle / FPS) / 3600} });
  const wastedWages = s.map(s=>s.wastedWage).reduce((a,b)=>a+b,0)
  const wages = staff.map(s=>s.wage * secondsToSimulate / 3600).reduce((a,b)=>a+b,0)

  return {
    income : income,
    wages : wages,
    staff : s,
    wastedWages : wastedWages,
    profit : income - wages
  }
}

function printMetrics() {
  console.log(JSON.stringify(calculateMetrics(), null, 2))
}

class TaskPrepareItem extends Task {
  static open;
  static initialize() { TaskPrepareItem.open = {} }

  item;
  onDone;
  stepStarted;
  stepsDuration;

  constructor(item, onDone) {
    super()
    TaskPrepareItem.open[this.id] = this

    this.item = item;
    this.onDone = onDone;

    this.stepsDuration = this.item.seconds * FPS;

    this.phases = [
      () => {
        if (this.staff.x == kitchen.x && this.staff.y == kitchen.y) {
          this.stepStarted = currentStep
          this.nextPhase()
        } else {
          moveTowards(this.staff, kitchen)
        }
      },
      () => {
        if (currentStep >= this.stepStarted + this.stepsDuration) {
          this.onDone(this)
          this.done()
        }
      }
    ]
  }
}

class TaskPrepareOrder extends Task {

  tasksOpen;

  constructor(order) {
    super()
    Task.taken[this.id] = this

    this.tasksOpen = new Set();
    const closeTask = (task) => { this.tasksOpen.delete(task) }

    for (const item of order.items) {
      this.tasksOpen.add(new TaskPrepareItem(item, closeTask))
    }

    this.phases = [
      () => {
        if (this.tasksOpen.size == 0) {
          new TaskDeliverItems(order)

          this.done()
        }
      }
    ]
  }


}

class TaskDeliverOrder extends Task {

  static open;
  static initialize() { TaskDeliverOrder.open = {} }

  order;

  constructor(order, staff) {
    super()
    this.order = order;
    this.staff = staff

    TaskDeliverOrder.open[this.id] = this;

    this.phases = [
      () => {
        if (this.staff.x == kitchen.x && this.staff.y == kitchen.y) {
          new TaskPrepareOrder(this.order)
          this.done();
        } else {
          moveTowards(this.staff, kitchen)
        }
      }
    ]
  }
}

class Order {
  items;
  table;
  onDeliver;

  constructor(items, table, onDeliver) {
    this.items = items;
    this.table = table;
    this.onDeliver = onDeliver;
  }
}

function takeOrder(staff, table, items, onDeliver) {
  const ordered = []

  for (let i = 0; i < table.group.size; i++) {
    const item = selectRandom(items)
    ordered.push(item)
    table.group.orderedItems.push(item)
  }

  const order = new Order(ordered, table, onDeliver)

  if (staffSendsOrdersRemotely) {
    new TaskPrepareOrder(order)
  } else {
    new TaskDeliverOrder(order, staff)
  }
}

// per group member
let secondsDurationGiveOrder = 5;
let secondsDecideFood = 5;

class TaskOrderDrinks extends Task {
  static open;
  static initialize() { TaskOrderDrinks.open = {} }

  table;
  stepStaffArrived;
  stepOrderedDrinks;

  constructor(table) {
    super()
    TaskOrderDrinks.open[this.id] = this

    this.table = table;

    this.phases = [
      // 1: staff goes to table
      () => {
        if (this.staff.x == this.table.x && this.staff.y == this.table.y) {
          this.stepStaffArrived = currentStep
          this.nextPhase()
        } else {
          moveTowards(this.staff, this.table)
        }
      },
      // 2: wait
      () => {
        if (currentStep >= this.stepStaffArrived + this.table.group.size * this.table.group.stepsOrdering) {
          this.stepOrderedDrinks = currentStep

          takeOrder(this.staff, this.table, drinks)

          this.staff.task = null;
          this.staff = null;

          this.nextPhase()
        }
      },
      () => {
        if (currentStep >= this.stepOrderedDrinks + this.table.group.stepsDecidingFood) {
          new TaskOrderFood(this.table)

          this.done()
        }
      }
    ]
  }
}

class TaskOrderFood extends Task {
  static open;
  static initialize() { TaskOrderFood.open = {} }

  table;
  stepStaffArrived;
  stepReceivedFood;

  constructor(table) {
    super()
    TaskOrderFood.open[this.id] = this

    this.table = table;
    this.stepsDuration = this.table.group.size * secondsDurationGiveOrder * FPS

    this.phases = [
      () => {
        if (this.staff.x == this.table.x && this.staff.y == this.table.y) {
          this.stepStaffArrived = currentStep
          this.nextPhase()
        } else {
          moveTowards(this.staff, this.table)
        }
      },
      () => {
        if (currentStep >= this.stepStaffArrived + this.table.group.size * this.table.group.stepsOrdering) {

          takeOrder(this.staff, this.table, drinks)
          takeOrder(this.staff, this.table, foods, () => { this.stepReceivedFood = currentStep })

          this.staff.task = null;
          this.staff = null;

          this.nextPhase()
        }
      },
      () => {
        if (this.stepReceivedFood) {
          this.nextPhase()
        }
      },
      () => {
        if (currentStep >= this.stepReceivedFood + this.table.group.stepsEatingFood) {
          new TaskOrderDesert(this.table)

          this.done()
        }
      }
    ]
  }
}

class TaskOrderDesert extends Task {
  static open;
  static initialize() { TaskOrderDesert.open = {} }

  table;
  staff;
  stepStaffArrived;
  stepReceivedDesert;

  constructor(table) {
    super()
    TaskOrderDesert.open[this.id] = this

    this.table = table;
    this.stepsDuration = this.table.group.size * secondsDurationGiveOrder * FPS

    this.phases = [
      // 1: staff goes to table
      () => {
        if (this.staff.x == this.table.x && this.staff.y == this.table.y) {
          this.stepStaffArrived = currentStep
          this.nextPhase()
        } else {
          moveTowards(this.staff, this.table)
        }
      },
      // 2: wait
      () => {
        if (currentStep >= this.stepStaffArrived + this.table.group.size * this.table.group.stepsOrdering) {

          takeOrder(this.staff, this.table, deserts, () => { this.stepReceivedDesert = currentStep })

          this.staff.task = null;
          this.staff = null;

          this.nextPhase()
        }
      },
      () => {
        if (this.stepReceivedDesert) {
          this.nextPhase()
        }
      },
      () => {
        if (currentStep >= this.stepReceivedDesert + this.table.group.stepsEatingDesert) {
          new TaskPay(this.table)

          this.done()
        }
      }
    ]
  }
}

class TaskPay extends Task {
  static open;
  static initialize() { TaskPay.open = {} }

  table;
  group;
  stepStaffArrived;

  constructor(table) {
    super()
    TaskPay.open[this.id] = this

    this.table = table;
    this.group = table.group;

    this.phases = [
      // 1: staff goes to table
      () => {
        if (this.staff.x == this.table.x && this.staff.y == this.table.y) {
          this.stepStaffArrived = currentStep
          this.nextPhase()
        } else {
          moveTowards(this.staff, this.table)
        }
      },
      () => {
        if (currentStep >= this.stepStaffArrived + this.group.stepsPaying) {

          const profitFromGroup = this.group.orderedItems.reduce((total, item) => total + item.profit, 0)
          income += profitFromGroup

          this.table.group = null;
          this.table = null;

          this.staff.task = null;
          this.staff = null;

          this.nextPhase()
        }
      },
      () => {
        if (this.group.x == groupEntranceExit.x && this.group.y == groupEntranceExit.y) {
          destroyGroup(this.group)
          this.done()
        } else {
          moveTowards(this.group, groupEntranceExit)
        }
      }
    ]
  }
}

class TaskSeat extends Task {
  static open;
  static initialize() { TaskSeat.open = {} }

  group;
  staff;
  table;

  constructor(group) {
    super()
    TaskSeat.open[this.id] = this

    this.group = group

    this.phases = [
      // 1
      () => {
        if (this.staff.x == this.group.x && this.staff.y == this.group.y) {
          this.nextPhase()
        } else {
          moveTowards(this.staff, this.group)
        }
      },
      // 2
      () => {
        let staffAtTable = false
        let groupAtTable = false

        if (this.staff.x == this.table.x && this.staff.y == this.table.y) {
          staffAtTable = true
        } else {
          moveTowards(this.staff, this.table)
        }

        if (this.group.x == this.table.x && this.group.y == this.table.y) {
          groupAtTable = true
        } else {
          moveTowards(this.group, this.table)
        }

        if (staffAtTable && groupAtTable) {
          new TaskOrderDrinks(this.table)

          this.done()
        }
      }
    ]
  }
}


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

  staff.forEach(({ x, y }, i) => {
    const top = y - size / 2
    const left = x - size / 2

    ctx.fillStyle = "orange";
    ctx.fillRect(left, top, size, size)

    ctx.fillStyle = "black"
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.font = `${Math.round(size / 4)}px Arial`;
    ctx.fillText(i, left + 2, top + 2)
  })
}

function drawGroups() {
  for (const id in groups) {
    const group = groups[id]
    const { x, y } = group

    const top = y - size / 2
    const left = x - size / 2

    ctx.fillStyle = "DarkSeaGreen";
    ctx.fillRect(left, top, size, size)

    ctx.fillStyle = "black"
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.font = `${Math.round(size / 4)}px Arial`;
    ctx.fillText(id, left + 2, top + 2)

    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.font = `${Math.round(size / 2)}px Arial`;
    ctx.fillText(group.size, x, y)
  }
}

function drawKitchen() {
  const { x, y } = kitchen

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
  const { x, y } = groupEntranceExit

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

let groupSizes = [[2, 0.5], [3, 0.2], [4, 0.3]].map(([size, probability]) => { return { size, probability } })

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
    x: groupEntranceExit.x,
    y: groupEntranceExit.y,
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

  new TaskSeat(group)

  return group
}

function destroyGroup(group) {
  delete groups[group.id]
}

function transformMenuItems(items, type) {
  return items.map(([name, probability, profit, seconds]) => {
    return { type, name, probability, profit, seconds }
  })
}

function initializeSimulation() {
  currentStep = 0
  stepNextGroupArrives = poisson(averageGroups, stepsToSimulate)

  Task.initialize()
  TaskSeat.initialize()
  TaskOrderDrinks.initialize()
  TaskOrderFood.initialize()
  TaskOrderDesert.initialize()
  TaskDeliverOrder.initialize()
  TaskPrepareItem.initialize()
  TaskDeliverItems.initialize()
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
    return { x, y, size, group, id }
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
    const tables = tablesArray.length == 0 ? allTables : new Set(tablesArray)
    const task = null
    const idleLocation = { x: x, y: y }
    const stepsIdle = 0
    return { id, x, y, idleLocation, tables, wage, doesTaskSeat, doesTaskTakeOrder, doesTaskDeliverOrder, doesTaskPrepareDrink, doesTaskPrepareFood, doesTaskPrepareDesert, task, stepsIdle }
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

function canPrepareItem(staff, item) {
  switch (item.type) {
    case 'drink': return staff.doesTaskPrepareDrink;
    case 'food': return staff.doesTaskPrepareFood;
    case 'desert': return staff.doesTaskPrepareDesert;
  }
}

function doStep() {

  if (currentStep >= stepNextGroupArrives) {
    // spawn group
    createGroup()

    stepNextGroupArrives = currentStep + poisson(averageGroups, stepsToSimulate)
  }

  // do not seat new groups after closing
  if (currentStep >= stepsToSimulate) {
    for (const id in TaskSeat.open) {
      const task = TaskSeat.open[id]

      destroyGroup(task.group)
      delete TaskSeat.open[task.id]
    }
  }

  // continue tasks

  for (const id in Task.taken) {
    const task = Task.taken[id]
    
    task.doStep()
  }

  // assign new tasks
  for (const id in TaskSeat.open) {
    const task = TaskSeat.open[id]

    const availableStaff = staff.filter(s => s.task == null && s.doesTaskSeat)
    if (availableStaff.length == 0) continue;

    for (const nearestStaff of sorted(availableStaff, nearest(task.group))) {

      const availableTables = tables.filter(table => table.group == null && table.size >= task.group.size && nearestStaff.tables.has(table.id))
      if (availableTables.length == 0) continue;

      let smallestAvailableTables = []

      for (const table of availableTables) {
        if (smallestAvailableTables.length == 0) {
          smallestAvailableTables.push(table)
        } else if (table.size == smallestAvailableTables[0].size) {
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

      delete TaskSeat.open[task.id]
      Task.taken[task.id] = task

      break;
    }
  }

  for (const id in TaskOrderDrinks.open) {
    const task = TaskOrderDrinks.open[id]

    const availableStaff = staff.filter(s => s.task == null && s.doesTaskTakeOrder && s.tables.has(task.table.id))
    if (availableStaff.length == 0) continue;

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
    if (availableStaff.length == 0) continue;

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
    if (availableStaff.length == 0) continue;

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
    if (availableStaff.length == 0) continue;

    const nearestStaff = sorted(availableStaff, nearest(task.table))[0]

    //console.log(`Taking desert order from table ${task.table.id}, staff ${nearestStaff.id}.`)

    task.staff = nearestStaff
    task.staff.task = task

    delete TaskPay.open[task.id]
    Task.taken[task.id] = task
  }

  for (const id in TaskPrepareItem.open) {
    const task = TaskPrepareItem.open[id]

    const availableStaff = staff.filter(s => s.task == null && canPrepareItem(s, task.item))
    if (availableStaff.length == 0) continue;

    const nearestStaff = sorted(availableStaff, nearest(kitchen))[0]

    task.staff = nearestStaff
    task.staff.task = task

    delete TaskPrepareItem.open[task.id]
    Task.taken[task.id] = task
  }

  for (const id in TaskDeliverOrder.open) {
    const task = TaskDeliverOrder.open[id]

    if (task.staff.task != null) continue;

    //console.log(`Deliver order by table ${task.order.table.id}, staff ${task.staff.id}.`)

    task.staff.task = task

    delete TaskDeliverOrder.open[task.id]
    Task.taken[task.id] = task
  }

  for (const id in TaskDeliverItems.open) {
    const task = TaskDeliverItems.open[id]

    const availableStaff = staff.filter(s => s.task == null && s.doesTaskDeliverOrder)
    if (availableStaff.length == 0) continue;

    const nearestStaff = sorted(availableStaff, nearest(kitchen))[0]

    //console.log(`Deliver items to table ${task.order.table.id}, staff ${nearestStaff.id}.`)

    task.staff = nearestStaff
    task.staff.task = task

    delete TaskDeliverItems.open[task.id]
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

let timeScale = 1000

function shouldStep() {
  return currentStep < stepsToSimulate || Object.keys(groups).length > 0
}

function frame() {
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
  intervalHandle = window.setInterval(frame, 1000 * dt)
})

document.getElementById("pause").addEventListener("click", () => {
  window.clearInterval(intervalHandle)
  intervalHandle = null
})

document.getElementById("reset").addEventListener("click", () => {
  initializeSimulation()
})

initializeSimulation()