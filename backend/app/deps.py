from fastapi import Header

DEFAULT_USER_ID = 1


def get_user_id(x_user_id: int | None = Header(default=DEFAULT_USER_ID, alias="X-User-Id")) -> int:
    return x_user_id or DEFAULT_USER_ID
