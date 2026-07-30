/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4163081445")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_reviews_sprint_student` ON `reviews` (`sprint`, `student`) WHERE `student` != ''"
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4163081445")

  // update collection data
  unmarshal({
    "indexes": []
  }, collection)

  return app.save(collection)
})
