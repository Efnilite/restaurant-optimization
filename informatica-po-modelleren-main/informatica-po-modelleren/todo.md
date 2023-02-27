order actual drinks
drink delivery policy: so many drinks per tray, load up tray as full as possible
after drinks delivered, create takeFoodOrder task
after food delivered, create FinishMeal task (which leads to payment and group vacating table)
  - each order adds profit to bill
  - on vacate, group pays for its table's bill

stop animation when reached max steps.

metrics:
- total profit
  - also over time: list of time and profit at that timeseconds and profit at that second
- idle time per worker
- waiting times, <=10 sec, <=1 minuut, <=5 minuut, <15 minuut, 15+ minuut
- drinks, tijd tussen bestelling plaatsen en bezorgen
- food, tijd tussen bestelling plaatsen en bezorgen

button to generate data N times, report average for each metric.