* http://mothering.com/forums:
  * qid “forum-listing-main-section”
    * qid “category-section”
      * qid “forum-item”
        ** qid “forum-item-title” (is an anchor w/ href to the actual forum)

* http://mothering.com/forums/forum.name:
  * qid “forum-page-thread-items”
    * qid “thread-item-parent”
      * qid “thread-item”
        ** qid “thread-item-title” (is an anchor w/ href to the thread)
        ** qid “thread-item-username” (is an anchor w/ href to the thread
          originator?)
  * qid “forum-item” (sub forum.)
    ** qid “forum-item-title” (is an anchor w/ href to the actual forum)
  * qid “page-nav-next-button” (is an anchor w/ href to the next page)

* http://mothering.com/threads/thread.name
  * qid “thread-main-section”
    * qid “thread-box-parent”
    * Just grab all the <article>s inside. Includes schema.org metadata, etc.
  * qid “page-nav-next-button” includes href for next page.


