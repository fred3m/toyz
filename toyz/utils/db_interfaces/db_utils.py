from __future__ import print_function, division
import re

from ..core import ToyzError

VALID_CHARS = '^[a-zA-z0-9_]+$'

USER_SETTINGS = ['pwd', 'stored_dirs']

def check_chars(err_flag, *lists):
    """
    Check if every value in every list is alpha-numeric
    
    Parameters
    ----------
    err_flag: boolean
        - If err_flag is True, an exception will be raised if the field is not alpha_numeric.
        If err_flag is False, the function will return False
    lists: lists
        - Each list in lists must be a list of strings, each one a keyword to verify if it is alpha-numeric
    """
    import itertools
    keys = list(itertools.chain.from_iterable(lists))
    if not all(re.match(VALID_CHARS, key) for key in keys):
        if err_flag:
            raise ToyzError("SQL parameters must only contain alpha-numeric characters or underscores")
        else:
            return False
    return True