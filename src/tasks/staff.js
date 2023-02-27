
// per drink
let secondsDurationDeliverDrink = 3;

/**
 * Task for delivering items to a table.
 */
class TaskDeliverOrderToTable extends Task {
    static open;

    static initialize() {
        TaskDeliverOrderToTable.open = {}
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
        TaskDeliverOrderToTable.open[this.id] = this

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
 * Task to prepare a specific item in the kitchen.
 */
class TaskPrepareItemInKitchen extends Task {
    static open;

    static initialize() {
        TaskPrepareItemInKitchen.open = {}
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
        TaskPrepareItemInKitchen.open[this.id] = this

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
 * Task where an entire order by a table gets prepared in the kitchen.
 * Each item gets prepared using {@link TaskPrepareItemInKitchen}
 */
class TaskPrepareOrderInKitchen extends Task {

    tasksOpen;

    constructor(order) {
        super()
        Task.taken[this.id] = this

        this.tasksOpen = new Set();
        const closeTask = (task) => {
            this.tasksOpen.delete(task)
        }

        for (const item of order.items) {
            this.tasksOpen.add(new TaskPrepareItemInKitchen(item, closeTask))
        }

        this.phases = [
            () => {
                if (this.tasksOpen.size === 0) {
                    new TaskDeliverOrderToTable(order)

                    this.done()
                }
            }
        ]
    }


}

/**
 * Task where an order is delivered to the kitchen to be prepared.
 */
class TaskDeliverOrderToKitchen extends Task {

    static open;

    static initialize() {
        TaskDeliverOrderToKitchen.open = {}
    }

    order;

    constructor(order, staff) {
        super()
        this.order = order;
        this.staff = staff

        TaskDeliverOrderToKitchen.open[this.id] = this;

        this.phases = [
            // move order
            () => {
                if (this.staff.x === kitchen.x && this.staff.y === kitchen.y) {
                    new TaskPrepareOrderInKitchen(this.order)
                    this.done();
                } else {
                    moveTowards(this.staff, kitchen)
                }
            }
        ]
    }
}

/**
 * Returns whether a staff member can prepare a specific item.
 *
 * @param   staff
 *          The staff member.
 *
 * @param   item
 *          The item to prepare.
 *
 * @return {*} true if able to, false if not.
 */
function canPrepareItem(staff, item) {
    switch (item.type) {
        case 'drink':
            return staff.doesTaskPrepareDrink;
        case 'food':
            return staff.doesTaskPrepareFood;
        case 'desert':
            return staff.doesTaskPrepareDesert;
    }
}