/**
 * An order.
 */
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