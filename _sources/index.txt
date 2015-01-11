.. Toyz documentation master file, created by
   sphinx-quickstart on Tue Dec 16 11:46:03 2014.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

Toyz for Data Reduction and Analysis
====================================

Contents:

**Introduction to Toyz**

.. toctree::
    :maxdepth: 3

    overview.rst
    install.rst
    getting_started.rst

Screenshots
===========
Visit the `github page <https://github.com/fred3m/toyz>`_ to see some sample screenshots 
from Toyz and Astropyp/Astro pypelines that will soon be converted to Toyz in the coming weeks.

Recent Changes
==============
**Workspaces** have been added. To access workspace (from a toyz session on the localhost)
navigate to ``localhost:8888/workspace/`` in your modern browser of choice. You will be able
to then add a data source (txt, csv, h5, etc.) to the current workspace which can be plotted
using Highcharts, and in the future viewed using a number of image viewers.

I'm still working on the Highcharts API but if you add a tile and attach a Highcharts chart
to it you will be able to have an interactive chart. Once this has been completed more thorough
documentation of this process will be added.

Coming Soon
===========
I'm still finishing transfering Toyz from the old `astropyp <https://github.com/fred3m/astropyp>`_
format. 
Some of the features that should be complete within the next week or two are
interactive **Highcharts** and **Graph3d** plots, and thorough documentation
about how to incorporate your own scripts into a toyz application. 
Once that's complete I will be pushing the distribution to PyPi so toyz can be installed
via `pip <https://pypi.python.org/pypi/pip>`_ .
Stay tuned.

Third Party Software
====================
Creating toyz was only possible due to the open source community, including other projects on
github.

The third party codes currently used in toyz are:
    - `loadpng <http://lodev.org/lodepng/>`_
    - `jquery <http://jquery.com/>`_
    - `jquery UI <http://jqueryui.com/>`_
    - `Graph 3d <http://almende.github.io/chap-links-library/js/graph3d/doc/>`_
    - `Google visual <https://developers.google.com/chart/interactive/docs/reference>`_
      (not bundled with code but linked from software)
    - `jQuery contextMenu <http://medialize.github.io/jQuery-contextMenu/index.html>`_
    - `jQuery getCss <https://github.com/furf/jquery-getCSS>`_
    - `Highcharts <http://www.highcharts.com>`_
      (not bundled with software but external web site)

Indices and tables
==================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`

