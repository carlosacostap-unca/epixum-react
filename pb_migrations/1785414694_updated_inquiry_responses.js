/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3588843627")

  // update collection data
  unmarshal({
    "createRule": "((@request.auth.id != \"\" && @collection.enrollments.cohort ?= @request.body.inquiry.cohort && @collection.enrollments.user ?= @request.auth.id && @collection.enrollments.status ?= \"active\") && @request.body.author = @request.auth.id)",
    "deleteRule": "((@request.auth.role = \"admin\" || (@request.auth.role = \"docente\" && @collection.enrollments.cohort ?= inquiry.cohort && @collection.enrollments.user ?= @request.auth.id && @collection.enrollments.role ?= \"teacher\" && @collection.enrollments.status ?= \"active\")) || ((@request.auth.id != \"\" && @collection.enrollments.cohort ?= inquiry.cohort && @collection.enrollments.user ?= @request.auth.id && @collection.enrollments.status ?= \"active\") && author = @request.auth.id))",
    "listRule": "(@request.auth.role = \"admin\" || (@request.auth.id != \"\" && @collection.enrollments.cohort ?= inquiry.cohort && @collection.enrollments.user ?= @request.auth.id && @collection.enrollments.status ?= \"active\"))",
    "updateRule": "(@request.auth.role = \"admin\" || ((@request.auth.id != \"\" && @collection.enrollments.cohort ?= inquiry.cohort && @collection.enrollments.user ?= @request.auth.id && @collection.enrollments.status ?= \"active\") && author = @request.auth.id && @request.body.author:changed = false && @request.body.inquiry:changed = false))",
    "viewRule": "(@request.auth.role = \"admin\" || (@request.auth.id != \"\" && @collection.enrollments.cohort ?= inquiry.cohort && @collection.enrollments.user ?= @request.auth.id && @collection.enrollments.status ?= \"active\"))"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3588843627")

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
