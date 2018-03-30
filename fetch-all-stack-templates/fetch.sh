#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

TEMPLATE_DIR=$DIR/.cache/templates/
STACK_LIST_CACHE=$DIR/.cache/stacks.txt

fetchTemplateByStackName() {
  stackName=$1
  aws cloudformation get-template \
    --stack-name $stackName \
    --template-stage Processed \
    --query TemplateBody \
    #--output text
}

fetchCompleteStacks() {
  aws cloudformation list-stacks \
    --stack-status-filter CREATE_COMPLETE ROLLBACK_COMPLETE UPDATE_COMPLETE UPDATE_ROLLBACK_COMPLETE \
    --query StackSummaries[].StackName \
    --output text
}

rm -rf $TEMPLATE_DIR
mkdir -p $TEMPLATE_DIR

if [ ! -f $STACK_LIST_CACHE ]; then
  fetchCompleteStacks > $STACK_LIST_CACHE
fi

stacks=$(<$STACK_LIST_CACHE)
for stackName in $stacks
do
  fetchTemplateByStackName $stackName > $TEMPLATE_DIR/$stackName.yaml
done