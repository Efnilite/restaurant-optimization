/*
    This file documents all interactions which are related to guest movement/interaction.
    The class order follows the life-cycle of a group.

    1) TaskSit - take a seat
    2) TaskOrderDrinks - order drinks
    3) TaskOrderFood - order food
    4) TaskOrderDesert - order desert
    5) TaskPay - pays for their meal and leave
 */

/**
 * Task where guests take a seat.
 */
class TaskSit extends Task {
    static open;

    static initialize() {
        TaskSit.open = {}
    }

    group;
    staff;
    table;

    constructor(group) {
        super()
        TaskSit.open[this.id] = this

        this.group = group

        this.phases = [
            // 1: move staff to group
            () => {
                if (this.staff.x === this.group.x && this.staff.y === this.group.y) {
                    this.nextPhase()
                } else {
                    moveTowards(this.staff, this.group)
                }
            },
            // 2: move group and staff to table
            () => {
                let staffAtTable = false
                let groupAtTable = false

                if (this.staff.x === this.table.x && this.staff.y === this.table.y) {
                    staffAtTable = true
                } else {
                    moveTowards(this.staff, this.table)
                }

                if (this.group.x === this.table.x && this.group.y === this.table.y) {
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

/**
 * Task where the group orders drinks.
 */
class TaskOrderDrinks extends Task {
    static open;

    static initialize() {
        TaskOrderDrinks.open = {}
    }

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
                if (this.staff.x === this.table.x && this.staff.y === this.table.y) {
                    this.stepStaffArrived = currentStep
                    this.nextPhase()
                } else {
                    moveTowards(this.staff, this.table)
                }
            },
            // 2: wait for order
            () => {
                if (currentStep >= this.stepStaffArrived + this.table.group.size * this.table.group.stepsOrdering) {
                    this.stepOrderedDrinks = currentStep

                    takeOrder(this.staff, this.table, drinks)

                    this.staff.task = null;
                    this.staff = null;

                    this.nextPhase()
                }
            },
            // 3: if drinks have been received, order food
            () => {
                if (currentStep >= this.stepOrderedDrinks + this.table.group.stepsDecidingFood) {
                    new TaskOrderFood(this.table)

                    this.done()
                }
            }
        ]
    }
}

/**
 * Task where food is ordered.
 */
class TaskOrderFood extends Task {
    static open;

    static initialize() {
        TaskOrderFood.open = {}
    }

    table;
    stepStaffArrived;
    stepReceivedFood;

    constructor(table) {
        super()
        TaskOrderFood.open[this.id] = this

        this.table = table;
        this.stepsDuration = this.table.group.size * secondsDurationGiveOrder * FPS

        this.phases = [
            // 1: move staff to table
            () => {
                if (this.staff.x === this.table.x && this.staff.y === this.table.y) {
                    this.stepStaffArrived = currentStep
                    this.nextPhase()
                } else {
                    moveTowards(this.staff, this.table)
                }
            },
            // 2: wait for order
            () => {
                if (currentStep >= this.stepStaffArrived + this.table.group.size * this.table.group.stepsOrdering) {

                    takeOrder(this.staff, this.table, drinks)
                    takeOrder(this.staff, this.table, foods, () => {
                        this.stepReceivedFood = currentStep
                    })

                    this.staff.task = null;
                    this.staff = null;

                    this.nextPhase()
                }
            },
            // 3: if order has been received
            () => {
                if (this.stepReceivedFood) {
                    this.nextPhase()
                }
            },
            // 4: if meal is done, order desert
            () => {
                if (currentStep >= this.stepReceivedFood + this.table.group.stepsEatingFood) {
                    new TaskOrderDesert(this.table)

                    this.done()
                }
            }
        ]
    }
}

/**
 * Task where the group orders desert.
 */
class TaskOrderDesert extends Task {
    static open;

    static initialize() {
        TaskOrderDesert.open = {}
    }

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
                if (this.staff.x === this.table.x && this.staff.y === this.table.y) {
                    this.stepStaffArrived = currentStep
                    this.nextPhase()
                } else {
                    moveTowards(this.staff, this.table)
                }
            },
            // 2: deliver desert
            () => {
                if (currentStep >= this.stepStaffArrived + this.table.group.size * this.table.group.stepsOrdering) {

                    takeOrder(this.staff, this.table, deserts, () => {
                        this.stepReceivedDesert = currentStep
                    })

                    this.staff.task = null;
                    this.staff = null;

                    this.nextPhase()
                }
            },
            // 3: if desert has been received
            () => {
                if (this.stepReceivedDesert) {
                    this.nextPhase()
                }
            },
            // 4: if desert is finished, pay
            () => {
                if (currentStep >= this.stepReceivedDesert + this.table.group.stepsEatingDesert) {
                    new TaskPay(this.table)

                    this.done()
                }
            }
        ]
    }
}

/**
 * Task where the group pays for their meal and leaves.
 */
class TaskPay extends Task {
    static open;

    static initialize() {
        TaskPay.open = {}
    }

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
                if (this.staff.x === this.table.x && this.staff.y === this.table.y) {
                    this.stepStaffArrived = currentStep
                    this.nextPhase()
                } else {
                    moveTowards(this.staff, this.table)
                }
            },
            // 2: add to income and remove tasks
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
            // 3: move group to door & unregister
            () => {
                if (this.group.x === door.x && this.group.y === door.y) {
                    destroyGroup(this.group)
                    this.done()
                } else {
                    moveTowards(this.group, door)
                }
            }
        ]
    }
}