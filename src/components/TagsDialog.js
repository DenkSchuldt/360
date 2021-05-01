
import React, { useState } from 'react';
import Dialog from '@denkschuldt/react-dialog';
import { motion, AnimatePresence } from "framer-motion";

import './TagsDialog.scss';


const TagsDialog = props => {
  const { tags, onClose, setAnchoredTags } = props;
  const [ anchoredTags, setTags ] = useState(props.anchoredTags);
  return (
    <Dialog
      slideIn='bottom'
      title='Hashtags'
      draggable={false}
      confirmText='Aplicar'
      className='dnk-tags-dialog'
      onConfirmClick={() => {
        setAnchoredTags(anchoredTags);
        onClose();
      }}
      onCloseClick={onClose}>
      <div className='dnk-tags'>
        {
          tags.map((tag, idx) => (
            <motion.span
              key={idx}
              layoutTransition
              className='dnk-tag'
              onClick={() => {
                setTags(
                  anchoredTags.includes(tag) ?
                    anchoredTags.filter(t => t !== tag) :
                    [ ...anchoredTags, tag]
                )
              }}>
              {`#${tag}`}
              <AnimatePresence>
                {
                  anchoredTags.includes(tag) &&
                  <motion.i
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="fas fa-thumbtack">
                  </motion.i>
                }
              </AnimatePresence>
            </motion.span>
          ))
        }
      </div>
    </Dialog>
  );
}

export default TagsDialog;
