
// per drink
let secondsDurationDeliverDrink = 3;

/**
 * Task for delivering items to a table.
 */
class TaskDeliverItems extends Task {
    static open;

    static initialize() {
        TaskDeliverItems.open = {}
    }

    /**
     * The order id.
     */
    order;
    /**
     * The amount of time it takes to walk to the table.
     */
    stepsDuration;

    constructor(order) {
        super()
        // add to task queue
        TaskDeliverItems.open[this.id] = this

        this.order = order;

        this.phases = [
            // 1: staff to kitchen
            () => {
                if (this.staff.x === kitchen.x && this.staff.y === kitchen.y) {
                    this.nextPhase();
                } else {
                    moveTowards(this.staff, kitchen)
                }
            },
            // 2: staff to table
            () => {
                if (this.staff.x === this.order.table.x && this.staff.y === this.order.table.y) {
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

/**
 * Task to prepare an item in the kitchen.
 */
class TaskPrepareItem extends Task {
    static open;

    static initialize() {
        TaskPrepareItem.open = {}
    }

    /**
     * The item to prepare.
     */
    item;
    /**
     * Function. What to do on completion. Takes 1 arg: this Task instance.
     */
    onDone;
    /**
     * Which step the Task started running.
     */
    stepStarted;
    /**
     * The time it takes to prepare this item.
     */
    stepsDuration;

    constructor(item, onDone) {
        super()
        TaskPrepareItem.open[this.id] = this

        this.item = item;
        this.onDone = onDone;

        this.stepsDuration = this.item.seconds * FPS;

        this.phases = [
            () => {
                if (this.staff.x === kitchen.x && this.staff.y === kitchen.y) {
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

/**
 * Task to prepare an order by a table.
 */
class TaskPrepareOrder extends Task {

    tasksOpen;

    constructor(order) {
        super()
        Task.taken[this.id] = this

        this.tasksOpen = new Set();
        const closeTask = (task) => {
            this.tasksOpen.delete(task)
        }

        for (const item of order.items) {
            this.tasksOpen.add(new TaskPrepareItem(item, closeTask))
        }

        this.phases = [
            () => {
                if (this.tasksOpen.size === 0) {
                    new TaskDeliverItems(order)

                    this.done()
                }
            }
        ]
    }


}

/**
 * Task where an order is delivered.
 */
class TaskDeliverOrder extends Task {

    static open;

    static initialize() {
        TaskDeliverOrder.open = {}
    }

    order;

    constructor(order, staff) {
        super()
        this.order = order;
        this.staff = staff

        TaskDeliverOrder.open[this.id] = this;

        this.phases = [
            // move order
            () => {
                if (this.staff.x === kitchen.x && this.staff.y === kitchen.y) {
                    new TaskPrepareOrder(this.order)
                    this.done();
                } else {
                    moveTowards(this.staff, kitchen)
                }
            }
        ]
    }
}