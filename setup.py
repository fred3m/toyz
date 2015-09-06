import os
import sys
import glob
from setuptools import setup
from setuptools import find_packages

import subprocess
import warnings


def update_git_devstr(version, path=None):
    """
    Updates the git revision string if and only if the path is being imported
    directly from a git working copy.  This ensures that the revision number in
    the version string is accurate.
    """

    try:
        # Quick way to determine if we're in git or not - returns '' if not
        devstr = get_git_devstr(sha=True, show_warning=False, path=path)
    except OSError:
        return version

    if not devstr:
        # Probably not in git so just pass silently
        return version

    if 'dev' in version:  # update to the current git revision
        version_base = version.split('.dev', 1)[0]
        devstr = get_git_devstr(sha=False, show_warning=False, path=path)

        return version_base + '.dev' + devstr
    else:
        #otherwise it's already the true/release version
        return version


def get_git_devstr(sha=False, show_warning=True, path=None):
    """
    Determines the number of revisions in this repository.

    Parameters
    ----------
    sha : bool
        If True, the full SHA1 hash will be returned. Otherwise, the total
        count of commits in the repository will be used as a "revision
        number".

    show_warning : bool
        If True, issue a warning if git returns an error code, otherwise errors
        pass silently.

    path : str or None
        If a string, specifies the directory to look in to find the git
        repository.  If `None`, the current working directory is used.
        If given a filename it uses the directory containing that file.

    Returns
    -------
    devversion : str
        Either a string with the revsion number (if `sha` is False), the
        SHA1 hash of the current commit (if `sha` is True), or an empty string
        if git version info could not be identified.

    """

    if path is None:
        path = os.getcwd()

    if not os.path.isdir(path):
        path = os.path.abspath(os.path.dirname(path))

    if not os.path.exists(os.path.join(path, '.git')):
        return ''

    if sha:
        cmd = ['rev-parse']  # Faster for getting just the hash of HEAD
    else:
        cmd = ['rev-list', '--count']

    try:
        p = subprocess.Popen(['git'] + cmd + ['HEAD'], cwd=path,
                             stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                             stdin=subprocess.PIPE)
        stdout, stderr = p.communicate()
    except OSError as e:
        if show_warning:
            warnings.warn('Error running git: ' + str(e))
        return ''

    if p.returncode == 128:
        if show_warning:
            warnings.warn('No git repository present at {0!r}! Using default '
                          'dev version.'.format(path))
        return ''
    elif p.returncode != 0:
        if show_warning:
            warnings.warn('Git failed while determining revision '
                          'count: ' + stderr)
        return ''

    if sha:
        return stdout.decode('utf-8')[:40]
    else:
        return stdout.decode('utf-8').strip()

_last_generated_version = '0.0.dev146'

version = update_git_devstr(_last_generated_version)
githash = get_git_devstr(sha=True, show_warning=False)


major = 0
minor = 0
bugfix = 0

release = False
debug = False

# Package info
PACKAGE_NAME = "toyz"
DESCRIPTION = "Data reduction and analysis software"
LONG_DESC = "Interface to run python plots and scripts from a web browser"
AUTHOR = "Fred Moolekamp"
AUTHOR_EMAIL = "fred.moolekamp@gmail.com"
LICENSE = "BSD 3-clause"
URL = "http://fred3m.github.io/toyz/"

# VERSION should be PEP386 compatible (http://www.python.org/dev/peps/pep-0386)
VERSION = '1.1.0dev'
#VERSION = '1.1.0'

if 'dev' in VERSION:
    VERSION += get_git_devstr(False)

scripts = [fname for fname in glob.glob(os.path.join('scripts', '*'))
           if os.path.basename(fname) != 'README.rst']

packages = find_packages()

setup(name=PACKAGE_NAME,
    version=VERSION,
    description=DESCRIPTION,
    packages=packages,
    scripts=scripts,
    extras_require={
        'all': [
            'scipy>=0.15',
            'matplotlib',
            'pandas>=0.14',
            'astropy>=0.4',
            'sqlalchemy',
            'pillow'
        ]
    },
    install_requires=[
        'tornado>=4.0.2,<4.2',
        'passlib',
        'numpy>=1.5.1',
        'six',
        'importlib'
    ],
    #provides=[PACKAGE_NAME],
    author=AUTHOR,
    author_email=AUTHOR_EMAIL,
    license=LICENSE,
    url=URL,
    long_description=LONG_DESC,
    zip_safe=False,
    use_2to3=True,
    include_package_data=True
)