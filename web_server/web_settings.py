import os
from passlib.context import CryptContext

#from .web_utils import BaseHandler
from ..utils import core

DEFAULT_PORT = 8888
COOKIE_SECRET = "2r#BA?Jjp.[pz;X}K>Z)V}X'cspe@kdf/[=3NC.CFM+8k&pQx0Z&'U=Sg&.J+.1A"
GUEST_ENABLED = False
USER_LOGIN = True
USER_TABLE = os.path.join(core.ROOT_DIR,'data','users.tbl')
GROUPS_TABLE = os.path.join(core.ROOT_DIR,'data','groups.tbl')
USER_SETTINGS = os.path.join(core.ROOT_DIR,'data','user_settings.tbl')
USE_DATABASE=False

# Password cryptography settings
pwd_context = CryptContext(
    schemes = ['sha512_crypt','pbkdf2_sha512'],
    default = "sha512_crypt",
    sha512_crypt__default_rounds = 500000,
    pbkdf2_sha512__default_rounds = 100000,
    all__vary_rounds = 0.1      # vary rounds parameter randomly when creating new hashes...
)

"""
# The r denotes the stings as regular expressions (regex)
# see https://docs.python.org/2/library/re.html for more
pypeline_handlers = [
    (r"/scrollTable", BaseHandler, {
        'template_name': 'scrollTable.html',
        'template_path': ['templates']
    }),
    (r"/fitsviewer", BaseHandler, {
        'template_name': 'fitsviewer.html',
        'template_path': ['pypelines','fitsviewer','templates']
    }),
    (r"/color-mag", BaseHandler, {
        'template_name': 'colormag.html',
        'template_path': ['pypelines','photometry','templates']
    })
]
"""