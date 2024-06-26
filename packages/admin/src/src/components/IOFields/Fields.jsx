import React from 'react';
import PropTypes from 'prop-types';

import {
    TextField,
    FormControl,
    InputAdornment,
    IconButton,
} from '@mui/material';

import { Close as CloseIcon } from '@mui/icons-material';

import { ColorPicker } from '@iobroker/adapter-react-v5';

export function IOTextField(props) {
    const IconCustom = props.icon;
    return <div className={props.classes.formContainer}>
        {IconCustom ? <IconCustom className={props.classes.formIcon} /> : null}
        <FormControl className={props.classes.formControl} variant="standard">
            <TextField
                variant="standard"
                label={props.t(props.label)}
                autoComplete={props.autoComplete}
                error={!!props.error}
                helperText={props.error || ''}
                value={props.value}
                onChange={props.onChange}
                disabled={props.disabled}
                InputLabelProps={{ shrink: true }}
                type={props.type}
                InputProps={{
                    readOnly: false,
                    endAdornment: props.value ? <InputAdornment position="end">
                        <IconButton
                            size="small"
                            onClick={() => props.onChange({ target: { value: '' } })}
                        >
                            <CloseIcon />
                        </IconButton>
                    </InputAdornment> : null,
                }}
            />
        </FormControl>
    </div>;
}

const IOColorPicker = props => {
    const IconCustom = props.icon;
    return <div style={{ width: '100%' }}>
        {IconCustom ? <IconCustom className={props.previewClassName || props.classes.formIcon} /> : null}
        <ColorPicker
            t={props.t}
            style={{ width: IconCustom ? 'calc(100% - 45px)' : '100%', display: 'inline-block', verticalAlign: 'top' }}
            name={props.t(props.label)}
            onChange={props.onChange}
            openAbove
            color={props.value || ''}
            className={props.className}
        />
    </div>;
};

IOColorPicker.propTypes = {
    label: PropTypes.string,
    value: PropTypes.any,
    classes: PropTypes.object,
    previewClassName: PropTypes.string,
    onChange: PropTypes.func,
    icon: PropTypes.object,
    className: PropTypes.string,
    t: PropTypes.func.isRequired,
};
export { IOColorPicker };
