/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3229316009")

  // update collection data
  unmarshal({
    "createRule": "(@request.auth.role = \"admin\" || (@request.auth.role = \"docente\" && @collection.enrollments.cohort ?= @request.body.sprint.cohort && @collection.enrollments.user ?= @request.auth.id && @collection.enrollments.role ?= \"teacher\" && @collection.enrollments.status ?= \"active\"))",
    "deleteRule": "(@request.auth.role = \"admin\" || (@request.auth.role = \"docente\" && @collection.enrollments.cohort ?= sprint.cohort && @collection.enrollments.user ?= @request.auth.id && @collection.enrollments.role ?= \"teacher\" && @collection.enrollments.status ?= \"active\"))",
    "listRule": "(@request.auth.role = \"admin\" || (@request.auth.id != \"\" && @collection.enrollments.cohort ?= sprint.cohort && @collection.enrollments.user ?= @request.auth.id && @collection.enrollments.status ?= \"active\"))",
    "updateRule": "(@request.auth.role = \"admin\" || (@request.auth.role = \"docente\" && @collection.enrollments.cohort ?= sprint.cohort && @collection.enrollments.user ?= @request.auth.id && @collection.enrollments.role ?= \"teacher\" && @collection.enrollments.status ?= \"active\"))",
    "viewRule": "(@request.auth.role = \"admin\" || (@request.auth.id != \"\" && @collection.enrollments.cohort ?= sprint.cohort && @collection.enrollments.user ?= @request.auth.id && @collection.enrollments.status ?= \"active\"))"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3229316009")

  // update collection data
  unmarshal({
    "createRule": null,
    "deleteRule": null,
    "listRule": null,
    "updateRule": null,
    "viewRule": null
  }, collection)

  return app.save(collection)
})
