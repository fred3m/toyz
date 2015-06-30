# Security Functions for Toyz
# Copyright 2015 by Fred Moolekamp
# License: BSD 3-clause

def encrypt_pickle(app_settings):
    """
    Encrypt the app settings using a config file. Not yet supported
    """
    raise ToyzError("Pickle encryption not yet supported")

def decrypt_pickle(app_settings, key):
    """
    Use the provided key to decrypt the config file. Not yet supported
    """
    raise ToyzError("Pickle encryption not yet supported")