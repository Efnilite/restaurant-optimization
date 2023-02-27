/**
 * Generic task.
 */
class Task {
    static taken;
    static nextId;

    static initialize() {
        Task.taken = {}
        Task.nextId = 0
    }

    /**
     * The current id of this Task.
     */
    id;
    stepCreated;
    /**
     * The current phase of this Task.
     * {@see phases} for more explanation.
     *
     * @type {number}
     */
    currentPhase = 0
    /**
     * Describes the phases of a Task. Example Task: TaskDeliverItem.
     * Phase 0: Go to kitchen. Pick up item.
     * Phase 1: Go to table. Deliver item.
     *
     * @type {[]}
     */
    phases = []
    /**
     * The instance of the staff performing this task. Null if task is for customer.
     */
    staff;

    constructor() {
        this.stepCreated = currentStep
        this.id = Task.nextId++
    }

    /**
     * When this Task has finished execution,
     * - remove assigned Task for staff if this Task was performed by staff.
     * - remove Task from register
     */
    done() {
        delete Task.taken[this.id]

        if (this.staff) {
            this.staff.task = null;
        }
    }

    nextPhase() {
        this.currentPhase += 1
    }

    doStep() {
        this.phases[this.currentPhase]()
    }
}