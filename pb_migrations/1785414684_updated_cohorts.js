/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1357820144")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.role = \"admin\" || (@request.auth.role = \"docente\" && @request.body.status = \"planned\")",
    "listRule": "@request.auth.role = \"admin\" || (@collection.enrollments.cohort ?= id && @collection.enrollments.user ?= @request.auth.id && @collection.enrollments.status ?= \"active\")",
    "updateRule": "@request.auth.role = \"admin\" || (@request.auth.role = \"docente\" && status != \"archived\" && (@collection.enrollments.cohort ?= id && @collection.enrollments.user ?= @request.auth.id && @collection.enrollments.status ?= \"active\") && (@request.body.status:changed = false || (status = \"planned\" && @request.body.status = \"active\") || (@request.body.status = \"archived\" && @request.body.course:changed = false && @request.body.name:changed = false && @request.body.startDate:changed = false && @request.body.endDate:changed = false)))",
    "viewRule": "@request.auth.role = \"admin\" || (@collection.enrollments.cohort ?= id && @collection.enrollments.user ?= @request.auth.id && @collection.enrollments.status ?= \"active\")"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1357820144")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.role = \"admin\"",
    "listRule": "@request.auth.role = \"admin\"",
    "updateRule": "@request.auth.role = \"admin\"",
    "viewRule": "@request.auth.role = \"admin\""
  }, collection)

  return app.save(collection)
})
