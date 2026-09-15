/// <reference path="../pb_data/types.d.ts" />

const previousReviewUpdateRule = '((@request.auth.role = "admin" || (@request.auth.role = "docente" && @collection.enrollments.cohort ?= sprint.cohort && @collection.enrollments.user ?= @request.auth.id && @collection.enrollments.role ?= "teacher" && @collection.enrollments.status ?= "active")) || (@request.auth.role = "estudiante" && (@request.auth.id != "" && @collection.enrollments.cohort ?= sprint.cohort && @collection.enrollments.user ?= @request.auth.id && @collection.enrollments.status ?= "active") && @request.body.sprint:changed = false && @request.body.teacher:changed = false && @request.body.startTime:changed = false && @request.body.endTime:changed = false && @request.body.public_note:changed = false && @request.body.status:changed = false && @request.body.meetingLink:changed = false && @request.body.roomNumber:changed = false && ((student = "" && @request.body.student = @request.auth.id && (@request.body.bookingOrdinal = "first" || @request.body.bookingOrdinal = "second")) || (student = @request.auth.id && @request.body.student = "" && @request.body.bookingOrdinal = ""))))'
const protectedReviewUpdateRule = '((@request.auth.role = "admin" || (@request.auth.role = "docente" && @collection.enrollments.cohort ?= sprint.cohort && @collection.enrollments.user ?= @request.auth.id && @collection.enrollments.role ?= "teacher" && @collection.enrollments.status ?= "active")) || (@request.auth.role = "estudiante" && (@request.auth.id != "" && @collection.enrollments.cohort ?= sprint.cohort && @collection.enrollments.user ?= @request.auth.id && @collection.enrollments.status ?= "active") && @request.body.sprint:changed = false && @request.body.teacher:changed = false && @request.body.startTime:changed = false && @request.body.endTime:changed = false && @request.body.public_note:changed = false && @request.body.status:changed = false && @request.body.meetingLink:changed = false && @request.body.roomNumber:changed = false && @request.body.studentCancellationLocked:changed = false && studentCancellationLocked = false && ((student = "" && @request.body.student = @request.auth.id && (@request.body.bookingOrdinal = "first" || @request.body.bookingOrdinal = "second")) || (student = @request.auth.id && @request.body.student = "" && @request.body.bookingOrdinal = ""))))'
const migrationReviewUpdateRule = '(@request.auth.role = "admin" || (@request.auth.role = "docente" && @collection.enrollments.cohort ?= sprint.cohort && @collection.enrollments.user ?= @request.auth.id && @collection.enrollments.role ?= "teacher" && @collection.enrollments.status ?= "active"))'
const previousPrivateNoteCreateRule = '(@request.auth.role = "admin" || (@request.auth.role = "docente" && @collection.enrollments.cohort ?= @request.body.review.sprint.cohort && @collection.enrollments.user ?= @request.auth.id && @collection.enrollments.role ?= "teacher" && @collection.enrollments.status ?= "active"))'
const previousPrivateNoteUpdateRule = '(@request.auth.role = "admin" || (@request.auth.role = "docente" && @collection.enrollments.cohort ?= review.sprint.cohort && @collection.enrollments.user ?= @request.auth.id && @collection.enrollments.role ?= "teacher" && @collection.enrollments.status ?= "active"))'

migrate((app) => {
  const reviews = app.findCollectionByNameOrId("reviews")
  reviews.fields.add(new Field({
    "help": "Prevents students from releasing a booking after teacher content is stored",
    "hidden": false,
    "id": "bool733950124",
    "name": "studentCancellationLocked",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))
  reviews.updateRule = migrationReviewUpdateRule
  app.save(reviews)

  app.db().newQuery(`
    UPDATE reviews
    SET studentCancellationLocked = CASE
      WHEN TRIM(COALESCE(public_note, '')) != ''
        OR COALESCE(status, '') NOT IN ('', 'Pendiente')
        OR EXISTS (
          SELECT 1 FROM review_private_notes
          WHERE review_private_notes.review = reviews.id
            AND TRIM(COALESCE(review_private_notes.content, '')) != ''
        )
      THEN 1 ELSE 0 END
  `).execute()

  reviews.updateRule = protectedReviewUpdateRule
  app.save(reviews)

  const notes = app.findCollectionByNameOrId("review_private_notes")
  notes.createRule = `(${previousPrivateNoteCreateRule} && @request.body.review.studentCancellationLocked = true)`
  notes.updateRule = `(${previousPrivateNoteUpdateRule} && (@request.body.content = "" || review.studentCancellationLocked = true))`
  return app.save(notes)
}, (app) => {
  const notes = app.findCollectionByNameOrId("review_private_notes")
  notes.createRule = previousPrivateNoteCreateRule
  notes.updateRule = previousPrivateNoteUpdateRule
  app.save(notes)

  const reviews = app.findCollectionByNameOrId("reviews")
  reviews.updateRule = previousReviewUpdateRule
  reviews.fields.removeById("bool733950124")
  return app.save(reviews)
})
