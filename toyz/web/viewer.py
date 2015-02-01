from __future__ import print_function, division
from collections import OrderedDict
from toyz.utils.errors import ToyzJobError
import math
import os
from toyz.utils import core

def get_file_info(filepath, tile_height=200, tile_width=400):
    ext_idx = 1
    ext = filepath.split('.')[-ext_idx].lower()
    if ext=='fz':
        ext_idx = 2
        ext = '.'.join(filepath.split('.')[-ext_idx:]).lower()
    file_info = {
        'ext': ext,
        'filename': '.'.join(os.path.basename(filepath).split('.')[:-ext_idx]),
        'filepath': filepath,
        'tile_width': tile_width,
        'tile_height': tile_height
    }
    
    if file_info['ext'] == 'fits' or file_info['ext'] == 'fits.fz':
        try:
            import astropy.io.fits as pyfits
        except ImportError:
            try:
                import pyfits
            except ImportError:
                raise ToyzJobError(
                    "You must have astropy or pyfits installed to view FITS images")
        # No need to check, since numpy is a dependence of astropy
        import numpy as np
        
        hdulist = pyfits.open(file_info['filepath'])
        file_info['hdulist'] = [hdu.__class__.__name__ for hdu in hdulist]
        file_info['images'] = OrderedDict([[str(n), {}] for n, hdu in enumerate(hdulist)
            if 'imagehdu' in hdu.__class__.__name__.lower()])
        if len(file_info['images']) == 0:
            raise ToyzJobError("FITS file does not contain any recognized image hdu's")
    else:
        file_info['images'] = {'0':{}}
        file_info['frame'] = '0'
    
    return file_info

def get_window(viewer):
    viewer['left']=int(viewer['x_center']-viewer['width']/2)
    viewer['bottom']=int(viewer['y_center']+viewer['height']/2)
    viewer['right']=int(viewer['left']+viewer['width'])
    viewer['top']=int(viewer['bottom']-viewer['height'])
    return viewer

def get_best_fit(data_width, data_height, img_viewer):
    # Make the image slightly smaller than the viewer size, to account for 
    # slight differences in the image height/width from the desired
    # tiles sizes
    x_scale = img_viewer['width']/data_width*.97
    y_scale = img_viewer['height']/data_height*.97
    scale = min(y_scale, x_scale)
    img_viewer['x_center'] = int(math.floor(data_width/2*scale))
    img_viewer['y_center'] = int(math.floor(data_height/2*scale))
    img_viewer['scale'] = scale
    img_viewer = get_window(img_viewer)
    return img_viewer

def get_img_info(file_info, save_path, img_viewer=None,
        frame=None, scale=None, colormap=None, px_min=None, px_max=None):
    if frame is None:
        frame = next(iter(file_info['images']))
    
    #TODO: For now I always invert the y-axis for fits files. Change this in the future
    # to allow the user to specify
    invert_x = False
    invert_y = False
    
    if file_info['ext'] == 'fits' or file_info['ext'] == 'fits.fz':
        try:
            import astropy.io.fits as pyfits
        except ImportError:
            try:
                import pyfits
            except ImportError:
                raise ToyzJobError(
                    "You must have astropy or pyfits installed to view FITS images")
        # No need to check, since numpy is a dependence of astropy
        import numpy as np
        hdulist = pyfits.open(file_info['filepath'])
        data = hdulist[int(frame)].data
        height, width = data.shape
        if px_min is None:
            px_min = float(data.min())
        if px_max is None:
             px_max = float(data.max())
        if colormap is None:
            colormap = 'Spectral'
        
        invert_y = True
    else:
        # For non-FITS formats, only a single large image is loaded, which 
        try:
            from PIL import Image
        except ImportError:
            raise ToyzJobError(
                "You must have PIL (Python Imaging Library) installed to "
                "open files of this type"
            )
        import numpy as np
        
        img = Image.open(file_info['filepath'])
        data = np.array(img)
        height, width, channels = data.shape
        px_min = 0
        px_max = 0
        colormap = ''
    
    if scale is None:
        if img_viewer is None:
            raise ToyzJobError("You must either supply a scale or image viewer parameters")
        if img_viewer['scale']<0:
            img_viewer = get_best_fit(width, height, img_viewer)
        else:
            img_viewer = get_window(img_viewer)
        scale = img_viewer['scale']
    elif img_viewer is None:
        img_viewer = {}
    
    #print('img_viewer', img_viewer)
    
    img_info = {
        'frame': frame,
        'height': height,
        'width': width,
        'scale': scale,
        'scaled_height': int(math.ceil(height*scale)),
        'scaled_width': int(math.ceil(width*scale)),
        'tiles': {},
        'px_min': px_min,
        'px_max': px_max,
        'colormap': colormap,
        'save_path': save_path,
        'invert_x': invert_x,
        'invert_y': invert_y
    }
    
    img_info['columns'] = int(math.ceil(img_info['scaled_width']/file_info['tile_width']))
    img_info['rows'] = int(math.ceil(img_info['scaled_height']/file_info['tile_height']))
    img_info['viewer'] = img_viewer
    #print('img_info:', img_info)
    return img_info

def scale_data(file_info, img_info, tile_info, data):
    import numpy as np
    if img_info['scale']==1:
        data = data[tile_info['y0_idx']:tile_info['yf_idx'],
            tile_info['x0_idx']:tile_info['xf_idx']]
    else:
        try:
            import scipy.ndimage
            print('using scipy')
            data = data[tile_info['y0_idx']:tile_info['yf_idx'],
                tile_info['x0_idx']:tile_info['xf_idx']]
            data = scipy.ndimage.zoom(data, img_info['scale'], order=0)
        except ImportError:
            if img_info['scale']>1:
                data = data[tile_info['y0_idx']:tile_info['yf_idx'],
                    tile_info['x0_idx']:tile_info['xf_idx']]
                data = np.kron(data, np.ones((img_info['scale'],img_info['scale'])))
                #data = zoom(data, img_info['scale'], order=0)
            elif img_info['scale']<1 and img_info['scale']>0:
                tile_width = min(file_info['tile_width'],
                    int((img_info['width']-tile_info['x0_idx'])*img_info['scale'])-1)
                tile_height = min(file_info['tile_height'],
                    int((img_info['height']-tile_info['y0_idx'])*img_info['scale'])-1)
        
                xmax = min(img_info['width']-1, tile_info['xf_idx'])
                ymax = min(img_info['height']-1, tile_info['yf_idx'])
        
                xIdx=np.linspace(tile_info['x0_idx'], xmax, tile_width)
                yIdx=np.linspace(tile_info['y0_idx'], ymax, tile_height)
                xIdx=np.array(xIdx,np.int)
                yIdx=np.reshape(np.array(yIdx,np.int),(yIdx.size,1))
                data = data[yIdx,xIdx]
            else:
                raise ToyzJobError('Scale must be a positive number')
    return data

def get_tile_info(file_info, img_info):
    """
    Get info for all tiles available in the viewer. If the tile has not been loaded yet,
    it is added to the new_tiles array.
    """
    all_tiles = []
    new_tiles = {}
    if img_info['invert_x']:
        pass
    else:
        xmin = img_info['viewer']['left']
        xmax = img_info['viewer']['right']
    if img_info['invert_y']:
        ymin = img_info['height']*img_info['scale'] - img_info['viewer']['bottom']
        ymax = img_info['height']*img_info['scale'] - img_info['viewer']['top']
    else:
        ymin = img_info['viewer']['top']
        ymax = img_info['viewer']['bottom']
    minCol = int(max(1,math.floor(xmin/file_info['tile_width'])))-1
    maxCol=int(min(img_info['columns'],math.ceil(xmax/file_info['tile_width'])))
    minRow = int(max(1,math.floor(ymin/file_info['tile_height'])))-1
    maxRow = int(min(img_info['rows'],math.ceil(ymax/file_info['tile_height'])))
    
    block_width = int(math.ceil(file_info['tile_width']/img_info['scale']))
    block_height = int(math.ceil(file_info['tile_height']/img_info['scale']))
    
    for row in range(minRow,maxRow):
        y0 = row*file_info['tile_height']
        yf = (row+1)*file_info['tile_height']
        y0_idx = int(y0/img_info['scale'])
        yf_idx = min(y0_idx + block_height, img_info['height'])
        for col in range(minCol,maxCol):
            all_tiles.append(str(col)+','+str(row))
            if str(col)+','+str(row) not in img_info['tiles']:
                x0 = col*file_info['tile_width']
                xf = (col+1)*file_info['tile_width']
                x0_idx = int(x0/img_info['scale'])
                xf_idx = min(x0_idx+block_width, img_info['width'])
                filename_params = [file_info['filename'], 
                    x0_idx, xf_idx, y0_idx, yf_idx, 
                    "{0:.3f}".format(img_info['scale']), img_info['colormap'], 
                    "{0:.2f}".format(img_info['px_min']), "{0:.2f}".format(img_info['px_max'])]
                new_filename = '_'.join([str(f) for f in filename_params])
                new_filepath = os.path.join(img_info['save_path'], new_filename+'.png')
                tile_width = int((xf_idx-x0_idx)*img_info['scale'])
                tile_height = int((yf_idx-y0_idx)*img_info['scale'])
                tile = {
                    'left': x0,
                    'right': xf,
                    'top': y0,
                    'bottom': yf,
                    'y0_idx': y0_idx,
                    'yf_idx': yf_idx,
                    'x0_idx': x0_idx,
                    'xf_idx': xf_idx,
                    'new_filepath': new_filepath,
                    'loaded': False,
                    'row': row,
                    'col': col,
                    'x': col*file_info['tile_width'],
                    'y': row*file_info['tile_height'],
                    'width': tile_width,
                    'height': tile_height
                }
                if img_info['invert_y']:
                    tile['top'] = yf
                    tile['bottom'] = y0
                if img_info['invert_x']:
                    tile['left'] = xf
                    tile['right'] = x0
                new_tiles[str(col)+','+str(row)] = tile
    print('new tiles', new_tiles.keys())
    return all_tiles, new_tiles

def create_tile(file_info, img_info, tile_info):
    try:
        from PIL import Image
    except ImportError:
        raise ToyzJobError(
            "You must have PIL (Python Imaging Library) installed to "
            "open files of this type"
        )
    
    if file_info['ext'] == 'fits' or file_info['ext'] == 'fits.fz':
        try:
            import astropy.io.fits as pyfits
        except ImportError:
            try:
                import pyfits
            except ImportError:
                raise ToyzJobError(
                    "You must have astropy or pyfits installed to view FITS images")
        # No need to check, since numpy is a dependence of astropy
        import numpy as np
        try:
            from matplotlib import cm as cmap
            from matplotlib.colors import Normalize, LinearSegmentedColormap
        except ImportError:
            raise ToyzJobError("You must have matplotlib installed to load FITS images")
        
        hdulist = pyfits.open(file_info['filepath'])
        data = hdulist[int(img_info['frame'])].data
        data = scale_data(file_info, img_info, tile_info, data)
        # FITS images have a flipped y-axis from what browsers and other image formats expect
        if img_info['invert_y']:
            data = np.flipud(data)
        if img_info['invert_x']:
            data = np.fliplr(data)
        
        #TODO: remove the following test lines
        img_info['px_min'] = 0
        img_info['px_max'] = 500
        img_info['colormap'] = 'afmhot'
        
        norm = Normalize(img_info['px_min'], img_info['px_max'], True)
        colormap = getattr(cmap, img_info['colormap'])
        cm = cmap.ScalarMappable(norm, colormap)
        img = np.uint8(cm.to_rgba(data)*255)
        img = Image.fromarray(img)
    else:
        # For non-FITS formats, only a single large image is loaded, which 
        import numpy as np
        
        img = Image.open(file_info['filepath'])
        img = img.crop((
            tile_info['x0_idx'], tile_info['y0_idx'], 
            tile_info['xf_idx'], 
            tile_info['yf_idx']))
        img = img.resize((tile_info['width'], tile_info['height']),Image.NEAREST)
    width, height = img.size
    if width>0 and height>0:
        path = os.path.dirname(tile_info['new_filepath'])
        core.create_paths([path])
        img.save(tile_info['new_filepath'], format='PNG')
    else:
        return False
    return True