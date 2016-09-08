import { SELECT } from '../../forms/fields';
import IndicatorExpressionManager from 'd2-ui/lib/indicator-expression-manager/IndicatorExpressionManager.component';
import dataElementOperandSelectorActions from 'd2-ui/lib/indicator-expression-manager/dataElementOperandSelector.actions';
import Store from 'd2-ui/lib/store/Store';
import Action from 'd2-ui/lib/action/Action';
import { getInstance } from 'd2/lib/d2';
import { Observable } from 'rx';
import React, { Component, PropTypes } from 'react';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import RaisedButton from 'material-ui/RaisedButton';

const expressionStatusStore = Store.create();

const expressionStatusActions = Action.createActionsFromNames(['requestExpressionStatus']);
expressionStatusActions.requestExpressionStatus
    .throttle(500)
    .map(action => {
        const encodedFormula = encodeURIComponent(action.data);
        const url = `expressions/description?expression=${encodedFormula}`;
        const request = getInstance()
            .then(d2 => {
                return d2.Api.getApi().get(url);
            });

        return Observable.fromPromise(request);
    })
    .concatAll()
    .subscribe(response => {
        expressionStatusStore.setState(response);
    });

function GeneratorExpression(props) {
    return (
        <IndicatorExpressionManager
            descriptionLabel={'description'}
            descriptionValue={props.value ? props.value.description : ''}
            formulaValue={props.value ? props.value.expression : ''}
            organisationUnitGroupOptions={[]}
            constantOptions={[]}
            expressionStatusActions={expressionStatusActions}
            expressionStatusStore={expressionStatusStore}
            dataElementOperandSelectorActions={dataElementOperandSelectorActions}
            indicatorExpressionChanged={(...args) => console.log(args)}
            titleText={props.labelText}
        />
    );
}

function ExpressionModal({ open, handleClose, handleSaveAndClose, ...props }) {
    const customContentStyle = {
        width: '100%',
        maxWidth: 'none',
    };

    const actions = [
        <FlatButton
            label="Cancel"
            primary={true}
            onTouchTap={handleClose}
        />,
        <FlatButton
            label="Submit"
            primary={true}
            onTouchTap={handleSaveAndClose}
        />,
    ];

    return (
        <Dialog
            open={open}
            actions={actions}
            modal={true}
            contentStyle={customContentStyle}
            style={{padding: '1rem'}}
        >
            <IndicatorExpressionManager
                descriptionLabel={'description'}
                descriptionValue={props.value ? props.value.description : ''}
                formulaValue={props.value ? props.value.expression : ''}
                organisationUnitGroupOptions={[]}
                constantOptions={[]}
                expressionStatusActions={expressionStatusActions}
                expressionStatusStore={expressionStatusStore}
                dataElementOperandSelectorActions={dataElementOperandSelectorActions}
                indicatorExpressionChanged={props.indicatorExpressionChanged}
                titleText={props.labelText}
            />
        </Dialog>
    );
}

class ExpressionField extends Component {
    state = {
        open: false,
        value: this.props.value,
    };

    handleOpen = () => {
        this.setState({open: true});
    };

    handleClose = () => {
        this.setState({open: false});
    };

    handleSaveAndClose = () => {
        this.setState({ open: false }, () => {
            this.props.onChange({
                target: {
                    value: this.state.value,
                }
            });
        });
    };

    indicatorExpressionChanged = ({ formula, description }) => {
        this.setState({
            value: Object.assign({}, this.state.value, { expression: formula, description, }),
        });
    };

    render() {
        const props = this.props;
        const styles = {
            fieldWrap: {
                padding: '1rem 0',
            },
        };

        return (
            <div style={styles.fieldWrap}>
                <RaisedButton
                    label={this.props.labelText}
                    onTouchTap={this.handleOpen}
                />
                <ExpressionModal
                    {...props}
                    open={this.state.open}
                    handleClose={this.handleClose}
                    handleSaveAndClose={this.handleSaveAndClose}
                    indicatorExpressionChanged={this.indicatorExpressionChanged}
                />
            </div>
        );
    }
}
ExpressionField.contextTypes = {
    d2: PropTypes.object,
};

export default new Map([
    ['periodType', {
        type: SELECT,
        fieldOptions: {
            options: [
                'Daily', 'Weekly', 'Monthly', 'BiMonthly', 'Quarterly', 'SixMonthlyApril', 'Yearly', 'FinancialApril', 'FinancialJuly', 'FinancialOctober',
            ],
        },
    }],
    ['generator', {
        component: ExpressionField,
        fieldOptions: {
            props: {
                validators: [],
            },
        },
    }],
    ['sampleSkipTest', {
        component: ExpressionField,
        props: {
            validators: [],
        },
    }],
]);
