/// <reference path="../pb_data/types.d.ts" />

const legacyIndexName = "idx_reviews_sprint_student"
const bookingIndexName = "idx_reviews_sprint_student_ordinal"
const legacyIndex = "CREATE UNIQUE INDEX `idx_reviews_sprint_student` ON `reviews` (`sprint`, `student`) WHERE `student` != ''"
const bookingIndex = "CREATE UNIQUE INDEX `idx_reviews_sprint_student_ordinal` ON `reviews` (`sprint`, `student`, (CASE WHEN `bookingOrdinal` = 'second' THEN 'second' ELSE 'first' END)) WHERE `student` != ''"

migrate((app) => {
  const collection = app.findCollectionByNameOrId("reviews")

  collection.fields.add(new Field({
    "help": "Internal first/second booking position within a sprint",
    "hidden": false,
    "id": "select592724810",
    "maxSelect": 1,
    "name": "bookingOrdinal",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": ["first", "second"]
  }))

  const indexes = Array.from(collection.indexes || [])
    .filter((index) => !index.includes(legacyIndexName) && !index.includes(bookingIndexName))
  unmarshal({ "indexes": [...indexes, bookingIndex] }, collection)

  return app.save(collection)
}, (app) => {
  const duplicate = new DynamicModel({ "total": 0 })
  app.db().newQuery(
    "SELECT COUNT(*) AS total FROM (SELECT 1 FROM reviews WHERE student != '' GROUP BY sprint, student HAVING COUNT(*) > 1)"
  ).one(duplicate)
  if (duplicate.total > 0) {
    throw new Error("Cannot restore the single-booking index while students have two reservations; no reviews were changed.")
  }

  const collection = app.findCollectionByNameOrId("reviews")
  const indexes = Array.from(collection.indexes || [])
    .filter((index) => !index.includes(legacyIndexName) && !index.includes(bookingIndexName))
  unmarshal({ "indexes": [...indexes, legacyIndex] }, collection)
  collection.fields.removeById("select592724810")

  return app.save(collection)
})
