/**
 * An order.
 */
class Order {
    /**
     * The items in the order.
     */
    items;
    /**
     * The owning table.
     */
    table;
    /**
     * Function to execute on deliver.
     */
    onDeliver;

    constructor(items, table, onDeliver) {
        this.items = items;
        this.table = table;
        this.onDeliver = onDeliver;
    }
}

/**
 * Takes an order.
 * From {@code items} a random item is taken, which is set as the ordered dish for that person.
 *
 * @param   staff
 *          The staff taking the order.
 *
 * @param   table
 *          The table.
 *
 * @param   items
 *          A list of all possible options that can be ordered.
 *
 * @param   onDeliver
 *          The function to execute when the order has been completed.
 */
function takeOrder(staff, table, items, onDeliver) {
    const ordered = []

    for (let i = 0; i < table.group.size; i++) {
        const item = selectRandom(items)
        ordered.push(item)
        table.group.orderedItems.push(item)
    }

    const order = new Order(ordered, table, onDeliver)

    // if remote is used, no need to deliver the order to kitchen
    if (staffSendsOrdersRemotely) {
        new TaskPrepareOrderInKitchen(order)
    } else {
        new TaskDeliverOrderToKitchen(order, staff)
    }
}