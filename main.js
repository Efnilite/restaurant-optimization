let logging = true;
function log(x) {
  if (logging) console.log(x)
}

const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")
const configTextArea = document.getElementById('config')
const buttonScale = document.getElementById('scale');

let scale = 1;
buttonScale.addEventListener('click', () => {
  if (scale == 1) {
    scale = 0.5;
    buttonScale.textContent = 'Scale: 0.5'
    draw()
  } else if (scale == 0.5) {
    scale = 1;
    buttonScale.textContent = 'Scale: 1'
    draw()
  }
})

// Should be initialized in config in tool
let secondsAcceptingGroups;
let groupSizes;
let averageGroups;
let initialGroups;

let secondsOrdering;
let secondsDecidingFood;
let secondsEatingFood;
let secondsEatingDesert;
let secondsPaying;

let entrance;
let kitchen;
let drinks;
let foods;
let deserts;
let tables;
let staff;

let staffSendsOrdersRemotely;
////////


// Reset by initialzeSimulation
let stepsAcceptingGroups;
let groups;
let nextGroupId;
let income;
let totalGroups;
let totalGuests;
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
  const s = staff.map(s => { return { id: s.id, uptime: 1 - (s.stepsIdle / stepsAcceptingGroups) } });
  const wages = staff.map(s => s.wage * secondsAcceptingGroups / 3600).reduce((a, b) => a + b, 0)

  return {
    totalSeconds : currentStep/FPS,
    totalHMS : hms(currentStep),
    totalGroups : totalGroups,
    totalGuests : totalGuests,
    income: income,
    wages: wages,
    staff: s
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

  constructor(item, onDone) {
    super()
    TaskPrepareItem.open[this.id] = this

    this.item = item;
    this.onDone = onDone;

    this.phases = [
      () => {
        if (this.staff.x == kitchen.x && this.staff.y == kitchen.y) {
          this.stepStarted = currentStep
          this.nextPhase()

          log(`${hms(currentStep)} started preparing ${this.item.name} (${this.id})`)
        } else {
          moveTowards(this.staff, kitchen)
        }
      },
      () => {
        if (currentStep >= this.stepStarted + this.item.seconds * FPS) {
          log(`${hms(currentStep)} done preparing ${this.item.name} (${this.id})`)
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

          log(`${hms(currentStep)} signal to order food (${this.table.group.id})`)
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

          log(`${hms(currentStep)} placed food order (${this.table.group.id})`)
        }
      },
      () => {
        if (this.stepReceivedFood) {
          this.nextPhase()

          log(`${hms(currentStep)} received food (${this.table.group.id})`)
        }
      },
      () => {
        if (currentStep >= this.stepReceivedFood + this.table.group.stepsEatingFood) {
          new TaskOrderDesert(this.table)

          this.done()

          log(`${hms(currentStep)} done eating food (${this.table.group.id})`)
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

          log(`${hms(currentStep)} ordered desert (${this.table.group.id})`)
        }
      },
      () => {
        if (this.stepReceivedDesert) {
          this.nextPhase()

          log(`${hms(currentStep)} received desert (${this.table.group.id})`)
        }
      },
      () => {
        if (currentStep >= this.stepReceivedDesert + this.table.group.stepsEatingDesert) {
          new TaskPay(this.table)

          this.done()

          log(`${hms(currentStep)} done eating desert, asking to pay (${this.table.group.id})`)
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

          log(`${hms(currentStep)} paid; leaving (${this.group.id})`)
        }
      },
      () => {
        if (this.group.x == entrance.x && this.group.y == entrance.y) {
          totalGroups++;
          totalGuests += this.group.size
          destroyGroup(this.group)
          this.done()
        } else {
          moveTowards(this.group, entrance)
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

const v = 1.4 * 100

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

const rectangleSize = 50

function drawRectangle(x, y, color, center, topLeft) {
  const top = y - rectangleSize / 2
  const left = x - rectangleSize / 2

  if (color == 'white') {
    ctx.strokeStyle = 'black';
    ctx.strokeRect(left, top, rectangleSize, rectangleSize)
  } else {
    ctx.fillStyle = color;
    ctx.fillRect(left, top, rectangleSize, rectangleSize)
  }

  if (center != null) {
    ctx.fillStyle = 'black';
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.font = `${Math.round(rectangleSize / 1.5)}px Arial`;
    ctx.fillText(center, x, y)
  }

  if (topLeft !== undefined) {

    ctx.fillStyle = 'black'
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.font = `${Math.round(rectangleSize / 2.5)}px Arial`;
    ctx.fillText(topLeft, left + 2, top + 2)
  }

}

function drawTables() {
  ctx.fillStyle = "black"
  tables.forEach((table, i) => {
    drawRectangle(table.x, table.y, 'white', table.size, i)
  })
}

function drawStaff() {
  staff.forEach(({ x, y }, i) => {
    drawRectangle(x, y, 'orange', null, i)
  })
}

function drawGroups() {
  for (const id in groups) {
    const group = groups[id]
    const { x, y } = group

    drawRectangle(x, y, "DarkSeaGreen", group.size, id)
  }
}

function drawKitchen() {
  const { x, y } = kitchen
  drawRectangle(x, y, 'white', 'K')
}

function drawEntranceExit() {
  const { x, y } = entrance
  drawRectangle(x, y, 'white', 'E')
}

function poisson(average, numSteps) {
  return Math.round(-Math.log(1 - Math.random()) / (average / numSteps))
}

function randomFromNormalDistribution({ mean, standardDeviation }) {
  // Box-Muller method
  return mean + standardDeviation * Math.sqrt(-2.0 * Math.log(Math.random())) * Math.cos(2.0 * Math.PI * Math.random())
}

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


const FPS = 25
const dt = 1 / FPS

let stepNextGroupArrives;

let intervalHandle = null

function repeat(n, f) {
  for (let i = 0; i < n; i++) {
    f()
  }
}

function createGroup() {

  if (currentStep >= stepsAcceptingGroups) return

  const id = nextGroupId++

  const group = {
    x: entrance.x,
    y: entrance.y,
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

let loadConfig;

function initializeSimulation() {

  if (loadConfig) {
    loadConfig();
  } else {
    return
  }

  stepsAcceptingGroups = secondsAcceptingGroups * FPS
  currentStep = 0
  stepNextGroupArrives = poisson(averageGroups, stepsAcceptingGroups)

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
  totalGroups = 0;
  totalGuests = 0;

  {
    const [x, y] = entrance
    entrance = { x, y }
  }

  {
    const [x, y] = kitchen
    kitchen = { x, y }
  }

  tables = tables.map(([x, y, size], id) => {
    const group = null
    return { x, y, size, group, id }
  })

  const allTables = new Set(tables.map(table => table.id))

  staff = staff.map(([x, y, tablesArray, wage, doesTaskSeat, doesTaskTakeOrder, doesTaskDeliverOrder, doesTaskPrepareDrink, doesTaskPrepareFood, doesTaskPrepareDesert], id) => {
    const tables = tablesArray.length == 0 ? allTables : new Set(tablesArray)
    const task = null
    const idleLocation = { x: x, y: y }
    const stepsIdle = 0
    return { id, x, y, idleLocation, tables, wage, doesTaskSeat, doesTaskTakeOrder, doesTaskDeliverOrder, doesTaskPrepareDrink, doesTaskPrepareFood, doesTaskPrepareDesert, task, stepsIdle }
  })

  drinks = transformMenuItems(drinks, "drink")
  foods = transformMenuItems(foods, "food")
  deserts = transformMenuItems(deserts, "desert")

  nextGroupId = 0
  groups = {}

  groupSizes = groupSizes.map(([size, probability]) => { return { size, probability } })

  repeat(randomFromNormalDistribution(initialGroups), createGroup)

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

    stepNextGroupArrives = currentStep + poisson(averageGroups, stepsAcceptingGroups)
  }

  // do not seat new groups after closing
  if (currentStep >= stepsAcceptingGroups) {
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

    task.staff = nearestStaff
    task.staff.task = task

    delete TaskPay.open[task.id]
    Task.taken[task.id] = task
  }

  for (const id in TaskPrepareItem.open) {
    const task = TaskPrepareItem.open[id]

    const availableStaff = staff.filter(s => s.task == null && canPrepareItem(s, task.item))
    if (availableStaff.length == 0) {
      log('no staff available')
      continue;
    }

    const nearestStaff = sorted(availableStaff, nearest(kitchen))[0]

    task.staff = nearestStaff
    task.staff.task = task

    delete TaskPrepareItem.open[task.id]
    Task.taken[task.id] = task
  }

  for (const id in TaskDeliverOrder.open) {
    const task = TaskDeliverOrder.open[id]

    if (task.staff.task != null) continue;

    task.staff.task = task

    delete TaskDeliverOrder.open[task.id]
    Task.taken[task.id] = task
  }

  for (const id in TaskDeliverItems.open) {
    const task = TaskDeliverItems.open[id]

    const availableStaff = staff.filter(s => s.task == null && s.doesTaskDeliverOrder)
    if (availableStaff.length == 0) {
      log('no staff available')
      continue;
    }

    const nearestStaff = sorted(availableStaff, nearest(kitchen))[0]

    task.staff = nearestStaff
    task.staff.task = task

    delete TaskDeliverItems.open[task.id]
    Task.taken[task.id] = task
  }

  // idle staff
  for (const s of staff) {
    if (!s.task) {
      // only count idle steps during actual simulation time
      if (currentStep < stepsAcceptingGroups) {
        s.stepsIdle++
      }

      moveTowards(s, s.idleLocation)
    }
  }

  currentStep++
}

function hms(step) {
  const seconds = Math.ceil(step /FPS)
  const ms = seconds % 3600
  const h = (seconds - ms) / 3600
  const s = ms % 60;
  const m = (ms - s) / 60

  return `${h}:${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`
}


function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  ctx.scale(scale, scale)

  drawTables()
  drawKitchen()
  drawEntranceExit()
  drawGroups()
  drawStaff()

  ctx.scale(1 / scale, 1 / scale)

  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.font = `18px Arial`;
  ctx.fillText(hms(currentStep), 2, 2)
}

let timeScale;

function shouldStep() {
  return currentStep < stepsAcceptingGroups || Object.keys(groups).length > 0
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

const initialConfig = `secondsAcceptingGroups = 2 * 60 * 60
groupSizes = [
  [2, 0.5],
  [3, 0.2],
  [4, 0.3]
]
averageGroups = 200
initialGroups = { mean: 4, standardDeviation: 2 }

secondsOrdering = { mean: 10, standardDeviation: 5 }
secondsDecidingFood = { mean: 5 * 60, standardDeviation: 3 * 60 }
secondsEatingFood = { mean: 15 * 60, standardDeviation: 5 * 60 }
secondsEatingDesert = { mean: 10 * 60, standardDeviation: 3 * 60 }
secondsPaying = { mean: 30, standardDeviation: 10 }

entrance = [300, 550]
kitchen = [550, 50]

drinks = [
  ["Cola", 0.5, 1.5, 2],
  ["Martini", 0.5, 2, 6],
]

foods = [
  ["Rice", 0.5, 3, 10],
  ["Potatoes", 0.5, 4, 15],
]

deserts = [
  ["Coffee", 0.5, 2, 10],
  ["Ice cream", 0.5, 2, 5],
]

tables = [
  [50, 50, 4],
  [150, 50, 3],
  [250, 150, 2],
  [350, 50, 2],
]

// x, y, tafelnummers, uurloon, verwelkomen, bestellingenOpnemen, voedselBezorgen, drankBereiden, gerechtBereiden, nagerechtBereiden
staff = [
  [500, 100, [], 12, false, false, false, false, true, true],
  [550, 100, [], 15, false, false, false, false, true, true],
  [550, 200, [0, 1], 10, false, true, true, true, false, false],
  [550, 250, [2, 3], 10, false, true, true, true, false, false],
  [225, 425, [], 14, true, true, true, false, false, false],
]

staffSendsOrdersRemotely = false`

loadConfig = () => eval(initialConfig)

configTextArea.value = initialConfig

configTextArea.addEventListener('input', () => {

  window.clearInterval(intervalHandle)
  intervalHandle = null

  const load = () => eval(configTextArea.value)

  try {
    load();
    loadConfig = load
    initializeSimulation()
  } catch (e) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'red';
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.font = `18px Arial`;
    ctx.fillText('Invalid config: ' + e.message, 10, 10)
  }
})

initializeSimulation()

document.getElementById('result-only').addEventListener('click', () => {
  initializeSimulation()
  while (shouldStep()) {
    doStep()
  }
  printMetrics()
});

[
  "time-scale-1",
  "time-scale-5",
  "time-scale-10",
  "time-scale-100",
  "time-scale-1000"
].forEach(id => {
  
  const radioBtn = document.getElementById(id)

  if (radioBtn.checked) {
    timeScale = parseInt(radioBtn.value)
  }

  radioBtn.addEventListener('change', () => {
    if (radioBtn.checked) {
      timeScale = parseInt(radioBtn.value)
    }
  })
})