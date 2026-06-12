from rest_framework.pagination import CursorPagination, PageNumberPagination


class StandardPagination(PageNumberPagination):
    """Page-number pagination for bounded lists (users, comments, search)."""

    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 50


class TimelineCursorPagination(CursorPagination):
    """Cursor pagination for infinite-scroll timelines (posts, notifications).

    Cursors stay correct while new items are inserted at the top, which
    page numbers cannot guarantee for a live feed.
    """

    page_size = 10
    ordering = "-created_at"
