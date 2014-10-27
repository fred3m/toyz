import os
from passlib.context import CryptContext

# Password cryptography settings
pwd_context = CryptContext(
    schemes = ['sha512_crypt','pbkdf2_sha512'],
    default = "sha512_crypt",
    sha512_crypt__default_rounds = 500000,
    pbkdf2_sha512__default_rounds = 100000,
    all__vary_rounds = 0.1      # vary rounds parameter randomly when creating new hashes...
)

DEFAULT_PORT = 8888
COOKIE_SECRET = "2r#BA?Jjp.[pz;X}K>Z)V}X'cspe@kdf/[=3NC.CFM+8k&pQx0Z&'U=Sg&.J+.1A"



#GUEST_ENABLED = False
#USER_LOGIN = True
#USER_TABLE = os.path.join(core.ROOT_DIR,'data','users.tbl')
#GROUPS_TABLE = os.path.join(core.ROOT_DIR,'data','groups.tbl')
#USER_SETTINGS = os.path.join(core.ROOT_DIR,'data','user_settings.tbl')
#USE_DATABASE=False